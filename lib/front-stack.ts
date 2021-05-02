import * as cdk from "@aws-cdk/core";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as iam from "@aws-cdk/aws-iam";
import * as targets from "@aws-cdk/aws-route53-targets";

import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";

import { DomainConfig } from "../config/domain";
import { ARecord, HostedZone, RecordTarget } from "@aws-cdk/aws-route53";
import {
  Bucket,
  BucketEncryption,
  BucketPolicy,
  HttpMethods,
} from "@aws-cdk/aws-s3";
import {
  AllowedMethods,
  CfnCloudFrontOriginAccessIdentity,
  ViewerProtocolPolicy,
} from "@aws-cdk/aws-cloudfront";
import { Effect } from "@aws-cdk/aws-iam";
import { Duration } from "@aws-cdk/core";

export class FrontStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { domainName, wildcard } = DomainConfig;

    const appName = process.env.APP_NAME;

    const alternativeNames = [];

    if (wildcard) {
      alternativeNames.push(`*.${domainName}`);
    }

    const hostedZone = HostedZone.fromLookup(this, `zone-${domainName}`, {
      domainName: domainName,
    });

    const certificate = new acm.Certificate(this, `certificate-${domainName}`, {
      domainName: domainName,
      subjectAlternativeNames: alternativeNames,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const bucket = new Bucket(this, `bucket-${domainName}`, {
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: `${domainName}.${appName}`,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    const CDNOAI = new CfnCloudFrontOriginAccessIdentity(
      this,
      `cdn-oia-${domainName}`,
      {
        cloudFrontOriginAccessIdentityConfig: {
          comment: "S3 OAI",
        },
      }
    );

    const policy = new iam.PolicyStatement({
      actions: ["s3:Get*"],
      effect: Effect.ALLOW,
      resources: [bucket.bucketArn, bucket.arnForObjects("*")],
    });

    policy.addCanonicalUserPrincipal(CDNOAI.attrS3CanonicalUserId);

    const bucketPolicy = new BucketPolicy(this, `bucket-policy-${domainName}`, {
      bucket,
    });

    bucketPolicy.document.addStatements(policy);

    const cloudFront = new cloudfront.Distribution(
      this,
      `cloudfront-${domainName}`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        certificate,
        defaultRootObject: "index.html",
        domainNames: [domainName],
        enabled: true,
        errorResponses: [
          {
            ttl: Duration.days(1),
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            ttl: Duration.days(1),
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new ARecord(this, `a-record-${domainName}`, {
      zone: hostedZone,
      ttl: Duration.minutes(5),
      target: RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudFront)),
      recordName: domainName,
    });
  }
}

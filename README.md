# Description

It's a CDK project to create an static web server using s3, cloudfront and certificate manager.
The idea was create a generic stack which could be configure using environment vars and deploy quickly.

## Pre Requirement

1. cdk
2. nodejs + ts
3. You should have a domain zone in aws with dns delegated.

## Step to deploy

1. Copy `.env.example` to `.env`
2. Complete environment vars
3. Configure your aws credentials [here](link:https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html)
4. Run `cdk deploy`

## Commands

- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

#!/usr/bin/env node
import "source-map-support/register";

import { config } from "dotenv";
import * as cdk from "@aws-cdk/core";
import { FrontStack } from "../lib/front-stack";

config();

const app = new cdk.App();

new FrontStack(app, "FrontStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

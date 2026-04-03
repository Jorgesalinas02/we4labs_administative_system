#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { We4labsDataStack } from "../lib/we4labs-data-stack";

const app = new cdk.App();

new We4labsDataStack(app, "We4labsData", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  description: "Aurora Serverless v2 PostgreSQL + RDS Proxy (We4Labs admin)",
});

app.synth();

#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load shared .env.local from workspace root
config({ path: resolve(__dirname, '..', '..', '..', '..', '.env.local') });

import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../domains/pipeline/stacks/pipeline-stack';
import { devConfig } from '../shared/config/environments/dev';

const app = new cdk.App();

// GitHub config: prefer CDK context, fall back to environment variables
const githubOwner =
  app.node.tryGetContext('githubOwner') ||
  process.env.GITHUB_OWNER ||
  'elprince-dev';

const githubRepo =
  app.node.tryGetContext('githubRepo') ||
  process.env.GITHUB_REPO ||
  'YasMadeAWS';

const branch =
  app.node.tryGetContext('branch') || process.env.GITHUB_BRANCH || 'main';

const connectionArn =
  app.node.tryGetContext('connectionArn') ||
  process.env.CODESTAR_CONNECTION_ARN ||
  '';

new PipelineStack(app, 'YasMade-Pipeline', {
  env: { account: devConfig.account, region: devConfig.region },
  githubOwner,
  githubRepo,
  branch,
  connectionArn,
  devConfig,
});

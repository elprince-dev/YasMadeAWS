#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load shared .env.local from workspace root
config({ path: resolve(__dirname, '..', '..', '..', '..', '.env.local') });

import * as cdk from 'aws-cdk-lib';
import { StaticHostingStack } from '../domains/frontend/stacks/static-hosting-stack';
import { CertificateStack } from '../domains/frontend/stacks/certificate-stack';
import { CdnStack } from '../domains/frontend/stacks/cdn-stack';
import { DnsStack } from '../domains/frontend/stacks/dns-stack';
import { EmailStack } from '../domains/email/stacks/email-stack';
import { devConfig } from '../shared/config/environments/dev';

const app = new cdk.App();
const env = { account: devConfig.account, region: devConfig.region };

// 1. Static hosting — S3 bucket for the React build output
const staticHosting = new StaticHostingStack(app, 'YasMade-StaticHosting-Dev', {
  environmentConfig: devConfig,
  env,
});

// 2. Certificate — Route53 hosted zone + ACM certificate (us-east-1)
const certificate = new CertificateStack(app, 'YasMade-Certificate-Dev', {
  environmentConfig: devConfig,
  // env is set inside CertificateStack to us-east-1
});

// 3. CDN — CloudFront distribution (needs S3 bucket + certificate)
const cdn = new CdnStack(app, 'YasMade-CDN-Dev', {
  environmentConfig: devConfig,
  originBucket: staticHosting.staticWebsite.bucket,
  certificate: certificate.sslCertificate.certificate,
  env,
});

// 4. DNS — Route53 A/AAAA/www records pointing to CloudFront
new DnsStack(app, 'YasMade-DNS-Dev', {
  environmentConfig: devConfig,
  distribution: cdn.cdnDistribution.distribution,
  hostedZone: certificate.hostedZone,
  env,
});

// 5. Email — SES identity + API Gateway + Lambda email handler
new EmailStack(app, 'YasMade-Email-Dev', {
  environmentConfig: devConfig,
  hostedZone: certificate.hostedZone,
  env,
});

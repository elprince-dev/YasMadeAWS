import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../../shared/types/environment';
import { StaticHostingStack } from '../../frontend/stacks/static-hosting-stack';
import { CertificateStack } from '../../frontend/stacks/certificate-stack';
import { CdnStack } from '../../frontend/stacks/cdn-stack';
import { DnsStack } from '../../frontend/stacks/dns-stack';
import { EmailStack } from '../../email/stacks/email-stack';

export interface DevStageProps extends StageProps {
  readonly environmentConfig: EnvironmentConfig;
}

/**
 * Dev Stage
 *
 * Groups all dev environment stacks into a single deployable unit
 * within the CI/CD pipeline.
 */
export class DevStage extends Stage {
  constructor(scope: Construct, id: string, props: DevStageProps) {
    super(scope, id, props);

    const env = {
      account: props.environmentConfig.account,
      region: props.environmentConfig.region,
    };

    // 1. Static hosting — S3 bucket for the React build output
    const staticHosting = new StaticHostingStack(this, 'StaticHosting', {
      environmentConfig: props.environmentConfig,
      env,
    });

    // 2. Certificate — Route53 hosted zone + ACM certificate (us-east-1)
    const certificate = new CertificateStack(this, 'Certificate', {
      environmentConfig: props.environmentConfig,
      // env is set inside CertificateStack to us-east-1
    });

    // 3. CDN — CloudFront distribution (needs S3 bucket + certificate)
    const cdn = new CdnStack(this, 'CDN', {
      environmentConfig: props.environmentConfig,
      originBucket: staticHosting.staticWebsite.bucket,
      certificate: certificate.sslCertificate.certificate,
      env,
    });
    cdn.addDependency(staticHosting);
    cdn.addDependency(certificate);

    // 4. DNS — Route53 A/AAAA/www records pointing to CloudFront
    const dns = new DnsStack(this, 'DNS', {
      environmentConfig: props.environmentConfig,
      distribution: cdn.cdnDistribution.distribution,
      hostedZone: certificate.hostedZone,
      env,
    });
    dns.addDependency(cdn);
    dns.addDependency(certificate);

    // 5. Email — SES identity + API Gateway + Lambda email handler
    const email = new EmailStack(this, 'Email', {
      environmentConfig: props.environmentConfig,
      hostedZone: certificate.hostedZone,
      env,
    });
    email.addDependency(cdn);
    email.addDependency(certificate);
  }
}

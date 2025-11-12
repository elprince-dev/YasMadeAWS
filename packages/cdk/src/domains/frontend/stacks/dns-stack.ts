
import { Construct } from 'constructs'
import { SslCertificate } from '../constructs/ssl-certificate'
import { DomainSetup } from '../constructs/domain-setup'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Distribution } from 'aws-cdk-lib/aws-cloudfront'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'

// Props for DNS Stack
export interface DnsStackProps extends StackProps {
  // Environment configuration
  readonly environmentConfig: EnvironmentConfig
  // CloudFront distribution from CDN stack
  readonly distribution: Distribution
}

/**
 * DNS Stack
 * Creates SSL certificate, hosted zone, and DNS records
 */
export class DnsStack extends Stack {
  // The SSL certificate construct
  public readonly sslCertificate: SslCertificate
  // The domain setup construct
  public readonly domainSetup: DomainSetup
  // The hosted zone
  public readonly hostedZone: IHostedZone

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, {
      ...props,
      // Certificate must be in us-east-1 for CloudFront
      env: {
        account: props.environmentConfig.account,
        region: props.environmentConfig.domain.certificateRegion
      }
    })

    // Create domain setup (hosted zone and DNS records)
    this.domainSetup = new DomainSetup(this, 'DomainSetup', {
      domainName: props.environmentConfig.domain.name,
      distribution: props.distribution,
      createHostedZone: props.environmentConfig.domain.createHostedZone,
      includeWwwRedirect: true,
      tags: props.environmentConfig.tags
    })

    // Store hosted zone reference
    this.hostedZone = this.domainSetup.hostedZone

    // Create SSL certificate with DNS validation
    this.sslCertificate = new SslCertificate(this, 'SslCertificate', {
      domainName: props.environmentConfig.domain.name,
      hostedZone: this.hostedZone,
      region: props.environmentConfig.domain.certificateRegion,
      tags: props.environmentConfig.tags
    })

    // Stack outputs
    new CfnOutput(this, 'CertificateArn', {
      value: this.sslCertificate.certificate.certificateArn,
      description: 'SSL Certificate ARN',
      exportName: `${this.stackName}-CertificateArn`
    })

    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${this.stackName}-HostedZoneId`
    })

    new CfnOutput(this, 'NameServers', {
      value: Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers (update in domain registrar)',
      exportName: `${this.stackName}-NameServers`
    })
  }
}

import { Construct } from 'constructs'
import { SslCertificate } from '../constructs/ssl-certificate'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53'

export interface CertificateStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig
}

/**
 * Certificate Stack
 * Creates Route53 hosted zone and ACM certificate.
 * Separated from DnsStack to break the circular dependency:
 * CdnStack needs the certificate, but DnsStack needs the distribution.
 */
export class CertificateStack extends Stack {
  public readonly sslCertificate: SslCertificate
  public readonly hostedZone: IHostedZone

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, {
      ...props,
      // Certificate must be in us-east-1 for CloudFront
      env: {
        account: props.environmentConfig.account,
        region: props.environmentConfig.domain.certificateRegion,
      },
    })

    const domainName = props.environmentConfig.domain.name

    // Create or look up hosted zone
    if (props.environmentConfig.domain.createHostedZone) {
      this.hostedZone = new HostedZone(this, 'HostedZone', {
        zoneName: domainName,
        comment: `Hosted zone for ${domainName}`,
      })
    } else {
      this.hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
        domainName,
      })
    }

    // Create SSL certificate with DNS validation
    this.sslCertificate = new SslCertificate(this, 'SslCertificate', {
      domainName,
      hostedZone: this.hostedZone,
      region: props.environmentConfig.domain.certificateRegion,
      tags: props.environmentConfig.tags,
    })

    // Stack outputs
    new CfnOutput(this, 'CertificateArn', {
      value: this.sslCertificate.certificate.certificateArn,
      description: 'SSL Certificate ARN',
      exportName: `${this.stackName}-CertificateArn`,
    })

    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${this.stackName}-HostedZoneId`,
    })

    new CfnOutput(this, 'NameServers', {
      value: Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers (update in domain registrar)',
      exportName: `${this.stackName}-NameServers`,
    })
  }
}

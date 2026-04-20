import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../../shared/types/environment';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import {
  AaaaRecord,
  ARecord,
  IHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

export interface DnsStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig;
  /** CloudFront distribution to point DNS records at */
  readonly distribution: Distribution;
  /** Route53 hosted zone from CertificateStack */
  readonly hostedZone: IHostedZone;
}

/**
 * DNS Stack
 * Creates A, AAAA, and www DNS records pointing to the CloudFront distribution.
 * The hosted zone and certificate are created separately in CertificateStack.
 */
export class DnsStack extends Stack {
  public readonly aRecord: ARecord;
  public readonly aaaaRecord: AaaaRecord;
  public readonly wwwRecord: ARecord;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    const domainName = props.environmentConfig.domain.name;

    // A record (IPv4) pointing to CloudFront
    this.aRecord = new ARecord(this, 'ARecord', {
      zone: props.hostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution)),
      comment: `A record for ${domainName} pointing to CloudFront`,
    });

    // AAAA record (IPv6) pointing to CloudFront
    this.aaaaRecord = new AaaaRecord(this, 'AAAARecord', {
      zone: props.hostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution)),
      comment: `AAAA record for ${domainName} pointing to CloudFront`,
    });

    // www subdomain redirect to apex
    this.wwwRecord = new ARecord(this, 'WwwRecord', {
      zone: props.hostedZone,
      recordName: `www.${domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution)),
      comment: `WWW redirect for www.${domainName} pointing to CloudFront`,
    });

    // Stack outputs
    new CfnOutput(this, 'ARecordDomain', {
      value: domainName,
      description: 'A record domain name',
    });

    new CfnOutput(this, 'WwwRecordDomain', {
      value: `www.${domainName}`,
      description: 'WWW record domain name',
    });
  }
}

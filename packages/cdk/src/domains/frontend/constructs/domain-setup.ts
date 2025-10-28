// Props for Domain Setup construct

import { CfnOutput, Fn, Stack, Tags } from "aws-cdk-lib"
import { Distribution } from "aws-cdk-lib/aws-cloudfront"
import { AaaaRecord, ARecord, HostedZone, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53"
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets"
import { Construct } from "constructs"

// Props for Domain Setup construct
export interface DomainSetupProps {
  // Domain name (e.g., 'example.com')
  readonly domainName: string
  // CloudFront distribution to point to
  readonly distribution: Distribution
  // Whether to create hosted zone (false if using existing)
  readonly createHostedZone?: boolean
  // Whether to create www subdomain redirect
  readonly includeWwwRedirect?: boolean
  // Resource tags
  readonly tags?: { [key: string]: string }
}

/**
 * Route53 Domain Setup construct
 * Creates hosted zone and DNS records for CloudFront distribution
 */

export class DomainSetup extends Construct {
    // The Route53 hosted zone
    public readonly hostedZone: IHostedZone
    // A record for apex domain
    public readonly aRecord: ARecord
    // AAAA record for IPv6 support
    public readonly aaaaRecord: AaaaRecord
    // WWW subdomain record (if enabled)
    public readonly wwwRecord?: ARecord

    constructor(scope: Construct, id: string, props: DomainSetupProps) {
    super(scope, id)

    // Create or reference hosted zone
    if (props.createHostedZone ?? true) {
      // Create new hosted zone
      this.hostedZone = new HostedZone(this, 'HostedZone', {
        zoneName: props.domainName,
        comment: `Hosted zone for ${props.domainName}`
      })
    } else {
      // Use existing hosted zone
      this.hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.domainName
      })
    }

    // Create A record (IPv4) pointing to CloudFront
    this.aRecord = new ARecord(this, 'ARecord', {
      zone: this.hostedZone,
      recordName: props.domainName,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(props.distribution)
      ),
      comment: `A record for ${props.domainName} pointing to CloudFront`
    })

    // Create AAAA record (IPv6) pointing to CloudFront
    this.aaaaRecord = new AaaaRecord(this, 'AAAARecord', {
      zone: this.hostedZone,
      recordName: props.domainName,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(props.distribution)
      ),
      comment: `AAAA record for ${props.domainName} pointing to CloudFront`
    })

    // Create www subdomain redirect if requested
    if (props.includeWwwRedirect ?? true) {
      this.wwwRecord = new ARecord(this, 'WwwRecord', {
        zone: this.hostedZone,
        recordName: `www.${props.domainName}`,
        target: RecordTarget.fromAlias(
          new CloudFrontTarget(props.distribution)
        ),
        comment: `WWW record for www.${props.domainName} pointing to CloudFront`
      })
    }

    // Apply tags if provided
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        if (props.createHostedZone ?? true) {
          Tags.of(this.hostedZone as HostedZone).add(key, value)
        }
      })
    }

    // Output DNS information
    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${Stack.of(this).stackName}-HostedZoneId`
    })

    new CfnOutput(this, 'NameServers', {
      value: Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers (update in domain registrar)',
      exportName: `${Stack.of(this).stackName}-NameServers`
    })

    new CfnOutput(this, 'DomainName', {
      value: props.domainName,
      description: 'Domain Name',
      exportName: `${Stack.of(this).stackName}-DomainName`
    })
  }
}
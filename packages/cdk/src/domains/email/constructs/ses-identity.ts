import { CfnOutput, Stack, Tags } from 'aws-cdk-lib'
import {
  EmailIdentity,
  Identity,
  MailFromBehaviorOnMxFailure,
} from 'aws-cdk-lib/aws-ses'
import {
  IHostedZone,
  MxRecord,
  TxtRecord,
} from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export interface SesIdentityProps {
  /** Root domain name (e.g. yasmade.net) */
  readonly domainName: string
  /** Route53 hosted zone for DNS record creation */
  readonly hostedZone: IHostedZone
  /** Resource tags */
  readonly tags?: Record<string, string>
}

/**
 * SES Domain Identity construct
 *
 * Creates an SES EmailIdentity with DKIM signing and a custom MAIL FROM
 * subdomain for SPF alignment. DKIM DNS records are managed automatically
 * by the CDK EmailIdentity construct; this construct adds the MAIL FROM
 * MX and SPF TXT records to the hosted zone.
 */
export class SesIdentity extends Construct {
  public readonly emailIdentity: EmailIdentity

  constructor(scope: Construct, id: string, props: SesIdentityProps) {
    super(scope, id)

    const mailFromSubdomain = `mail.${props.domainName}`

    // Create SES domain identity with DKIM (auto-configured by CDK)
    this.emailIdentity = new EmailIdentity(this, 'EmailIdentity', {
      identity: Identity.publicHostedZone(props.hostedZone),
      mailFromDomain: mailFromSubdomain,
      mailFromBehaviorOnMxFailure: MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE,
    })

    // MX record for MAIL FROM subdomain — routes bounce/complaint
    // notifications back to SES in the stack's region
    new MxRecord(this, 'MailFromMx', {
      zone: props.hostedZone,
      recordName: mailFromSubdomain,
      values: [
        {
          priority: 10,
          hostName: `feedback-smtp.${Stack.of(this).region}.amazonses.com`,
        },
      ],
      comment: `MX record for SES MAIL FROM subdomain ${mailFromSubdomain}`,
    })

    // SPF TXT record for MAIL FROM subdomain
    new TxtRecord(this, 'MailFromSpf', {
      zone: props.hostedZone,
      recordName: mailFromSubdomain,
      values: ['v=spf1 include:amazonses.com ~all'],
      comment: `SPF record for SES MAIL FROM subdomain ${mailFromSubdomain}`,
    })

    // Apply tags
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        Tags.of(this.emailIdentity).add(key, value)
      })
    }

    // Outputs
    new CfnOutput(this, 'SesIdentityName', {
      value: props.domainName,
      description: 'SES verified domain identity',
      exportName: `${Stack.of(this).stackName}-SesIdentity`,
    })
  }
}

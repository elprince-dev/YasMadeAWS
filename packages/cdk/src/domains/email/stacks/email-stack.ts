import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { SesIdentity } from '../constructs/ses-identity'
import { EmailApi } from '../constructs/email-api'

export interface EmailStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig
  /** Route53 hosted zone from CertificateStack */
  readonly hostedZone: IHostedZone
}

/**
 * Email Stack
 *
 * Composes the SES domain identity and Email API (API Gateway + Lambda)
 * constructs into a single deployable stack.
 */
export class EmailStack extends Stack {
  public readonly sesIdentity: SesIdentity
  public readonly emailApi: EmailApi

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props)

    const domainName = props.environmentConfig.domain.name

    // SES domain identity with DKIM + MAIL FROM
    this.sesIdentity = new SesIdentity(this, 'SesIdentity', {
      domainName,
      hostedZone: props.hostedZone,
      tags: props.environmentConfig.tags,
    })

    // API Gateway + Lambda email handler
    this.emailApi = new EmailApi(this, 'EmailApi', {
      sesIdentity: this.sesIdentity.emailIdentity,
      domainName,
      allowedOrigins: [
        `https://${domainName}`,
        `https://www.${domainName}`,
        'http://localhost:5173',
      ],
      adminEmail: `admin@${domainName}`,
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      tags: props.environmentConfig.tags,
    })

    // Stack outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: this.emailApi.httpApi.apiEndpoint,
      description: 'Email API base URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    })
  }
}

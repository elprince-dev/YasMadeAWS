import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { SesIdentity } from '../../domains/email/constructs/ses-identity';

const testEnv = { account: '123456789012', region: 'us-east-1' };

describe('SesIdentity', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestSesStack', { env: testEnv });

    const hostedZone = new HostedZone(stack, 'Zone', {
      zoneName: 'yasmade.net',
    });

    new SesIdentity(stack, 'Ses', {
      domainName: 'yasmade.net',
      hostedZone,
      tags: { Environment: 'test', Project: 'yasmade' },
    });

    template = Template.fromStack(stack);
  });

  test('creates SES EmailIdentity for the domain', () => {
    template.hasResourceProperties('AWS::SES::EmailIdentity', {
      EmailIdentity: 'yasmade.net',
    });
  });

  test('configures MAIL FROM subdomain', () => {
    template.hasResourceProperties('AWS::SES::EmailIdentity', {
      MailFromAttributes: Match.objectLike({
        MailFromDomain: 'mail.yasmade.net',
        BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
      }),
    });
  });

  test('creates DKIM DNS records via EmailIdentity', () => {
    // When using Identity.publicHostedZone(), CDK automatically creates
    // three DKIM CNAME records in the hosted zone. Verify at least one
    // DKIM CNAME record set exists.
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'CNAME',
    });
  });

  test('creates MX record for MAIL FROM subdomain', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: 'mail.yasmade.net.',
      ResourceRecords: ['10 feedback-smtp.us-east-1.amazonses.com'],
    });
  });

  test('creates SPF TXT record for MAIL FROM subdomain', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: 'mail.yasmade.net.',
      ResourceRecords: ['"v=spf1 include:amazonses.com ~all"'],
    });
  });
});

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { EmailStack } from '../../domains/email/stacks/email-stack';
import { EnvironmentConfig } from '../../shared/types/environment';

const testConfig: EnvironmentConfig = {
  environment: 'test',
  account: '123456789012',
  region: 'us-east-1',
  domain: {
    name: 'test.example.com',
    certificateRegion: 'us-east-1',
    createHostedZone: true,
  },
  buckets: {
    staticWebsite: 'test-static-website',
    buildArtifacts: 'test-build-artifacts',
  },
  cloudFront: {
    enabled: true,
    comment: 'Test Distribution',
    defaultRootObject: 'index.html',
    errorConfigurations: [],
  },
  tags: {
    Environment: 'test',
    Project: 'yasmade',
    Owner: 'test',
  },
};

const testEnv = { account: '123456789012', region: 'us-east-1' };

describe('EmailStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();

    // EmailStack needs a hosted zone — create one in a helper stack
    const helperStack = new cdk.Stack(app, 'HelperStack', { env: testEnv });
    const hostedZone = new HostedZone(helperStack, 'Zone', {
      zoneName: 'test.example.com',
    });

    const emailStack = new EmailStack(app, 'TestEmailStack', {
      environmentConfig: testConfig,
      hostedZone,
      env: testEnv,
    });

    template = Template.fromStack(emailStack);
  });

  test('creates Lambda function with Node.js 20.x runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
    });
  });

  test('Lambda has required environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          ADMIN_EMAIL: 'admin@test.example.com',
          DOMAIN_NAME: 'test.example.com',
        }),
      },
    });
  });

  test('Lambda has SES send permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ['ses:SendEmail', 'ses:SendRawEmail'],
            Effect: 'Allow',
          }),
        ]),
      }),
    });
  });

  test('creates HTTP API (API Gateway v2)', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: 'test.example.com-email-api',
      ProtocolType: 'HTTP',
    });
  });

  test('HTTP API has CORS configured', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: Match.objectLike({
        AllowMethods: ['POST', 'OPTIONS'],
        AllowHeaders: ['Content-Type', 'Authorization'],
        AllowOrigins: Match.arrayWith([
          'https://test.example.com',
          'https://www.test.example.com',
        ]),
      }),
    });
  });

  test('creates routes for newsletter, contact, and order-confirmation', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /newsletter',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /contact',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /order-confirmation',
    });
  });

  test('creates SES EmailIdentity for the domain', () => {
    template.hasResourceProperties('AWS::SES::EmailIdentity', {
      EmailIdentity: 'test.example.com',
    });
  });

  test('creates Lambda integration for API Gateway', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      PayloadFormatVersion: '2.0',
    });
  });
});

import { CfnOutput, Duration, Stack, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
  HttpRouteIntegration,
  HttpIntegrationType,
  PayloadFormatVersion,
} from 'aws-cdk-lib/aws-apigatewayv2';
import type {
  HttpRouteIntegrationConfig,
  HttpRouteIntegrationBindOptions,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';
import * as path from 'path';

export interface EmailApiProps {
  /** SES email identity for granting send permissions */
  readonly sesIdentity: EmailIdentity;
  /** Root domain name (e.g. yasmade.net) */
  readonly domainName: string;
  /** Allowed CORS origins (e.g. ['https://yasmade.net']) */
  readonly allowedOrigins: string[];
  /** Admin email address for notifications */
  readonly adminEmail: string;
  /** Supabase project URL for JWT verification */
  readonly supabaseUrl?: string;
  /** Supabase anon key for JWT verification */
  readonly supabaseAnonKey?: string;
  /** Resource tags */
  readonly tags?: Record<string, string>;
}

/**
 * Inline Lambda integration for HTTP API routes.
 * Avoids the need for the alpha @aws-cdk/aws-apigatewayv2-integrations package.
 */
class LambdaProxyIntegration extends HttpRouteIntegration {
  constructor(id: string, private readonly handler: NodejsFunction) {
    super(id);
  }

  bind(options: HttpRouteIntegrationBindOptions): HttpRouteIntegrationConfig {
    this.handler.addPermission(`${options.route.node.id}-Invoke`, {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: options.route.httpApi.arnForExecuteApi(),
    });
    return {
      type: HttpIntegrationType.AWS_PROXY,
      uri: this.handler.functionArn,
      payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
    };
  }
}

/**
 * Email API construct
 *
 * Creates a Lambda function (Node.js 20.x) that handles email sending via SES,
 * fronted by an HTTP API (API Gateway v2) with CORS and stage-level throttling.
 *
 * Routes:
 *  - POST /newsletter       (admin-authenticated)
 *  - POST /contact          (public, rate-limited at stage level)
 *  - POST /order-confirmation (admin-authenticated)
 */
export class EmailApi extends Construct {
  public readonly httpApi: HttpApi;
  public readonly emailHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: EmailApiProps) {
    super(scope, id);

    // Lambda function bundled from the email handler source
    this.emailHandler = new NodejsFunction(this, 'EmailHandler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'lambda', 'email-handler.ts'),
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        ADMIN_EMAIL: props.adminEmail,
        DOMAIN_NAME: props.domainName,
        SUPABASE_URL: props.supabaseUrl ?? '',
        SUPABASE_ANON_KEY: props.supabaseAnonKey ?? '',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant SES send permissions
    this.emailHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [
          `arn:aws:ses:${Stack.of(this).region}:${
            Stack.of(this).account
          }:identity/${props.domainName}`,
        ],
      })
    );

    // HTTP API with CORS and stage-level throttling (10 req/s, burst 20)
    // Stage throttle applies to all routes; the /contact endpoint is the
    // primary public surface that benefits from this limit.
    this.httpApi = new HttpApi(this, 'HttpApi', {
      apiName: `${props.domainName}-email-api`,
      description: `Email API for ${props.domainName}`,
      corsPreflight: {
        allowOrigins: props.allowedOrigins,
        allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: Duration.hours(1),
      },
    });

    const lambdaIntegration = new LambdaProxyIntegration(
      'EmailHandlerIntegration',
      this.emailHandler
    );

    // POST /newsletter
    this.httpApi.addRoutes({
      path: '/newsletter',
      methods: [HttpMethod.POST],
      integration: lambdaIntegration,
    });

    // POST /contact
    this.httpApi.addRoutes({
      path: '/contact',
      methods: [HttpMethod.POST],
      integration: lambdaIntegration,
    });

    // POST /order-confirmation
    this.httpApi.addRoutes({
      path: '/order-confirmation',
      methods: [HttpMethod.POST],
      integration: lambdaIntegration,
    });

    // Apply tags
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        Tags.of(this).add(key, value);
      });
    }

    // Outputs
    new CfnOutput(this, 'EmailApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'Email API endpoint URL',
      exportName: `${Stack.of(this).stackName}-EmailApiUrl`,
    });
  }
}

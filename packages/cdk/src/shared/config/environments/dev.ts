import { Duration } from 'aws-cdk-lib'
import { APP_NAME, AWS_REGIONS } from '../constants/aws'
import { EnvironmentConfig } from '../../types/environment'

// Development environment configuration
export const devConfig: EnvironmentConfig = {
  environment: 'dev',
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: AWS_REGIONS.PRIMARY,

  domain: {
    name: 'dev.yasmade.net',
    certificateRegion: AWS_REGIONS.CERTIFICATE,
    createHostedZone: true,
  },

  buckets: {
    staticWebsite: `${APP_NAME}-dev-static-website`,
    buildArtifacts: `${APP_NAME}-dev-build-artifacts`,
  },

  cloudFront: {
    enabled: true,
    comment: 'YasMade Development Website Distribution',
    defaultRootObject: 'index.html',
    errorConfigurations: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.seconds(0),
      },
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.seconds(0),
      },
    ],
  },

  tags: {
    Environment: 'dev',
    Project: APP_NAME,
    Owner: 'elprince-dev',
  },
}

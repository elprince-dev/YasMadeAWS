import { Duration } from 'aws-cdk-lib'
import { APP_NAME, AWS_REGIONS } from '../constants/aws'
import { EnvironmentConfig } from '../../types/environment'

// Production environment configuration
export const prodConfig: EnvironmentConfig = {
  environment: 'prod',
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: AWS_REGIONS.PRIMARY,

  domain: {
    name: 'yasmade.net',
    certificateRegion: AWS_REGIONS.CERTIFICATE,
    createHostedZone: true,
  },

  buckets: {
    staticWebsite: `${APP_NAME}-prod-static-website`,
    buildArtifacts: `${APP_NAME}-prod-build-artifacts`,
  },

  cloudFront: {
    enabled: true,
    comment: 'YasMade Production Website Distribution',
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
    Environment: 'prod',
    Project: APP_NAME,
    Owner: 'elprince-dev',
  },
}

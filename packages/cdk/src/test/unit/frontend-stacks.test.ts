import * as cdk from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { StaticHostingStack } from '../../domains/frontend/stacks/static-hosting-stack'
import { CertificateStack } from '../../domains/frontend/stacks/certificate-stack'
import { CdnDistribution } from '../../domains/frontend/constructs/cdn-distribution'
import { StaticWebsite } from '../../domains/frontend/constructs/static-website'
import { EnvironmentConfig } from '../../shared/types/environment'
import { DnsStack } from '../../domains/frontend/stacks/dns-stack'
import { HostedZone } from 'aws-cdk-lib/aws-route53'

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
    errorConfigurations: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: cdk.Duration.seconds(0),
      },
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: cdk.Duration.seconds(0),
      },
    ],
  },
  tags: {
    Environment: 'test',
    Project: 'yasmade',
    Owner: 'test',
  },
}

const testEnv = { account: '123456789012', region: 'us-east-1' }

describe('StaticHostingStack', () => {
  let template: Template

  beforeAll(() => {
    const app = new cdk.App()
    const stack = new StaticHostingStack(app, 'TestStaticHosting', {
      environmentConfig: testConfig,
      env: testEnv,
    })
    template = Template.fromStack(stack)
  })

  test('creates S3 bucket with public access blocked', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    })
  })

  test('creates S3 bucket with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    })
  })

  test('creates S3 bucket with SSL enforcement', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Condition: {
              Bool: { 'aws:SecureTransport': 'false' },
            },
            Effect: 'Deny',
          }),
        ]),
      }),
    })
  })
})

describe('CertificateStack', () => {
  let template: Template

  beforeAll(() => {
    const app = new cdk.App()
    const stack = new CertificateStack(app, 'TestCertificate', {
      environmentConfig: testConfig,
    })
    template = Template.fromStack(stack)
  })

  test('creates Route53 hosted zone', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'test.example.com.',
    })
  })

  test('creates ACM certificate with DNS validation', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'test.example.com',
      SubjectAlternativeNames: ['www.test.example.com'],
      ValidationMethod: 'DNS',
    })
  })
})

// CdnStack and DnsStack tests use a single stack to avoid cross-stack cyclic
// dependency issues that arise when S3 OAC creates a bucket policy referencing
// the CloudFront distribution while the distribution references the bucket.
describe('CdnDistribution (in-stack)', () => {
  let template: Template

  beforeAll(() => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'TestCdnInStack', { env: testEnv })

    const website = new StaticWebsite(stack, 'Website', {
      bucketName: 'test-cdn-bucket',
      versioned: true,
    })

    new CdnDistribution(stack, 'Cdn', {
      originBucket: website.bucket,
      comment: testConfig.cloudFront.comment,
      defaultRootObject: testConfig.cloudFront.defaultRootObject,
      errorConfigurations: testConfig.cloudFront.errorConfigurations,
    })

    template = Template.fromStack(stack)
  })

  test('creates CloudFront distribution with index.html as default root object', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
      }),
    })
  })

  test('creates CloudFront distribution with SPA error responses', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
        ]),
      }),
    })
  })

  test('creates CloudFront distribution with PriceClass_100', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        PriceClass: 'PriceClass_100',
      }),
    })
  })

  test('creates CloudFront distribution with HTTPS redirect and compression', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
        }),
      }),
    })
  })
})

describe('DnsStack', () => {
  let template: Template

  beforeAll(() => {
    const app = new cdk.App()

    // Create a single stack with a hosted zone and a dummy distribution
    // to avoid cross-stack cyclic dependencies in tests
    const helperStack = new cdk.Stack(app, 'HelperStack', { env: testEnv })
    const website = new StaticWebsite(helperStack, 'Website', {
      bucketName: 'test-dns-bucket',
      versioned: true,
    })
    const cdn = new CdnDistribution(helperStack, 'Cdn', {
      originBucket: website.bucket,
      comment: 'helper',
      defaultRootObject: 'index.html',
      errorConfigurations: [],
    })
    const zone = new HostedZone(helperStack, 'Zone', {
      zoneName: 'test.example.com',
    })

    const dnsStack = new DnsStack(app, 'TestDns', {
      environmentConfig: testConfig,
      distribution: cdn.distribution,
      hostedZone: zone,
      env: testEnv,
    })

    template = Template.fromStack(dnsStack)
  })

  test('creates A record for apex domain', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'test.example.com.',
    })
  })

  test('creates AAAA record for apex domain', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'AAAA',
      Name: 'test.example.com.',
    })
  })

  test('creates A record for www subdomain', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'www.test.example.com.',
    })
  })
})

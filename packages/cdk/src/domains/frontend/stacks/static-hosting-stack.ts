import { Construct } from 'constructs'
import { StaticWebsite } from '../constructs/static-website'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import * as path from 'path'
import * as fs from 'fs'

// Props for Static Hosting Stack
export interface StaticHostingStackProps extends StackProps {
  // Environment configuration
  readonly environmentConfig: EnvironmentConfig
  /** CloudFront distribution for cache invalidation (optional) */
  readonly distribution?: IDistribution
  /** Path to the frontend build output directory. Defaults to packages/frontend/dist.
   *  Deployment is skipped if the directory does not exist (e.g. during tests or first-time synth). */
  readonly frontendBuildPath?: string
}

/**
 * Static Hosting Stack
 * Creates S3 bucket for static website hosting and deploys the frontend build output
 */
export class StaticHostingStack extends Stack {
  // The static website construct
  public readonly staticWebsite: StaticWebsite

  constructor(scope: Construct, id: string, props: StaticHostingStackProps) {
    super(scope, id, props)

    // Create static website with S3 bucket
    this.staticWebsite = new StaticWebsite(this, 'StaticWebsite', {
      bucketName: props.environmentConfig.buckets.staticWebsite,
      versioned: true,
      lifecycleRules: true,
      tags: props.environmentConfig.tags
    })

    // Deploy frontend build output to S3 (skipped when dist folder doesn't exist)
    const buildPath = props.frontendBuildPath
      ?? path.join(__dirname, '..', '..', '..', '..', '..', 'frontend', 'dist')

    if (fs.existsSync(buildPath)) {
      new BucketDeployment(this, 'DeployFrontend', {
        sources: [Source.asset(buildPath)],
        destinationBucket: this.staticWebsite.bucket,
        distribution: props.distribution,
        distributionPaths: props.distribution ? ['/*'] : undefined,
      })
    }

    // Stack outputs
    new CfnOutput(this, 'BucketName', {
      value: this.staticWebsite.bucket.bucketName,
      description: 'S3 Static Website Bucket Name',
      exportName: `${this.stackName}-BucketName`
    })

    new CfnOutput(this, 'BucketArn', {
      value: this.staticWebsite.bucket.bucketArn,
      description: 'S3 Static Website Bucket ARN',
      exportName: `${this.stackName}-BucketArn`
    })
  }
}

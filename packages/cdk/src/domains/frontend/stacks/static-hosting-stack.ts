import { Construct } from 'constructs'
import { StaticWebsite } from '../constructs/static-website'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'

// Props for Static Hosting Stack
export interface StaticHostingStackProps extends StackProps {
  // Environment configuration
  readonly environmentConfig: EnvironmentConfig
}

/**
 * Static Hosting Stack
 * Creates S3 bucket for static website hosting
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

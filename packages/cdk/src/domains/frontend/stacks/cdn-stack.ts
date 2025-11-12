import { Construct } from 'constructs'
import { CdnDistribution } from '../constructs/cdn-distribution'
import { getAllBehaviors } from '../config/cdn-behaviors'
import { EnvironmentConfig } from '../../../shared/types/environment'
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'

// Props for CDN Stack
export interface CdnStackProps extends StackProps {
  // Environment configuration
  readonly environmentConfig: EnvironmentConfig
  // S3 bucket from static hosting stack
  readonly originBucket: Bucket
  // SSL certificate from certificate stack
  readonly certificate?: Certificate
}

/**
 * CDN Stack
 * Creates CloudFront distribution for global content delivery
 */
export class CdnStack extends Stack {
  // The CDN distribution construct
  public readonly cdnDistribution: CdnDistribution

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props)

    // Create CloudFront distribution
    this.cdnDistribution = new CdnDistribution(this, 'CdnDistribution', {
      originBucket: props.originBucket,
      certificate: props.certificate,
      domainNames: props.certificate ? [props.environmentConfig.domain.name] : undefined,
      comment: props.environmentConfig.cloudFront.comment,
      defaultRootObject: props.environmentConfig.cloudFront.defaultRootObject,
      errorConfigurations: props.environmentConfig.cloudFront.errorConfigurations,
      tags: props.environmentConfig.tags
    })

    // Update the distribution with additional behaviors
    const additionalBehaviors = getAllBehaviors()
    
    // Apply additional behaviors to the distribution
    Object.entries(additionalBehaviors).forEach(([pathPattern, behavior]) => {
      // Note: CDK doesn't allow modifying distribution after creation
      // Additional behaviors should be added in the construct itself
    })

    // Stack outputs
    new CfnOutput(this, 'DistributionId', {
      value: this.cdnDistribution.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${this.stackName}-DistributionId`
    })

    new CfnOutput(this, 'DistributionDomainName', {
      value: this.cdnDistribution.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `${this.stackName}-DistributionDomainName`
    })

    new CfnOutput(this, 'DistributionUrl', {
      value: props.certificate 
        ? `https://${props.environmentConfig.domain.name}`
        : `https://${this.cdnDistribution.distribution.distributionDomainName}`,
      description: 'Website URL',
      exportName: `${this.stackName}-WebsiteUrl`
    })
  }
}

import { CfnOutput, Stack, Tags } from "aws-cdk-lib"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"
import { AllowedMethods, CachePolicy, CfnOriginAccessControl, Distribution, ErrorResponse, HttpVersion, PriceClass, SecurityPolicyProtocol, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront"
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

// Props for CDN Distribution construct
export interface CdnDistributionProps {
  // S3 bucket origin
  readonly originBucket:Bucket
  // SSL certificate for custom domain
  readonly certificate?: Certificate
  // Custom domain names
  readonly domainNames?: string[]
  // Distribution comment/description
  readonly comment: string
  // Default root object (usually index.html)
  readonly defaultRootObject: string
  // Error page configurations for SPA routing
  readonly errorConfigurations: ErrorResponse[]
  // Resource tags
  readonly tags?: { [key: string]: string }
}

/**
 * CloudFront Distribution construct
 * Creates CDN distribution optimized for React SPA hosting
 */
export class CdnDistribution extends Construct {
    // The CloudFront distribution
    public readonly distribution: Distribution;

    constructor(scope: Construct, id: string, props: CdnDistributionProps){
        super(scope, id)

        // Create S3 origin using the correct static method
        const s3Origin = S3BucketOrigin.withOriginAccessControl(props.originBucket)
        
        //Create CloudFront distribution
        this.distribution = new Distribution(this, 'Distribution', {
            // Default behavior for all requests
            defaultBehavior: {
                origin: s3Origin,
                // Redirect HTTP to HTTPS
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // Allow GET and HEAD methods
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                // Optimized caching for static assets
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                // Enable compression
                compress: true
            },
            // Additional cache behaviors for different file types
            additionalBehaviors: {
                // Cache static assets longer (CSS, JS, images)
                '/static/*': {
                    origin: s3Origin,
                    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                    compress: true
                },
                // Don't cache service worker (for PWA updates)
                '/service-worker.js': {
                    origin: s3Origin,
                    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: CachePolicy.CACHING_DISABLED,
                    compress: false
                }
            },
            // Custom domain configuration
            domainNames: props.domainNames,
            certificate: props.certificate,
            
            // Default file to serve
            defaultRootObject: props.defaultRootObject,

            // Error responses for SPA routing (404 -> index.html)
            errorResponses: props.errorConfigurations,

            // Distribution settings
            comment: props.comment,
            enabled: true,
            httpVersion: HttpVersion.HTTP2_AND_3,
            priceClass: PriceClass.PRICE_CLASS_100, // US, Canada, Europe
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021
        })

        // Apply tags if provided
        if (props.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                Tags.of(this.distribution).add(key, value)
            })
        }

        // Output distribution information
        new CfnOutput(this, 'DistributionId', {
        value: this.distribution.distributionId,
        description: 'CloudFront Distribution ID',
        exportName: `${Stack.of(this).stackName}-DistributionId`
        })

        new CfnOutput(this, 'DistributionDomainName', {
        value: this.distribution.distributionDomainName,
        description: 'CloudFront Distribution Domain Name',
        exportName: `${Stack.of(this).stackName}-DistributionDomainName`
        })
    }

}
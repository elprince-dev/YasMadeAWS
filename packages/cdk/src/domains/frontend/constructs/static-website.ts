import { CfnOutput, Duration, RemovalPolicy, Stack, Tags } from "aws-cdk-lib";
import { CfnOriginAccessControl } from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods, StorageClass } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

// Props for Static Website construct
export interface StaticWebsiteProps {
    // S3 bucket name (must be globally unique)
    readonly bucketName: string;
    // Enable versioning for rollback capability
    readonly versioned?: boolean;
    // Lifecycle rules for cost optimization
    readonly lifecycleRules?: boolean;
    // Resource tags
    readonly tags?: { [key: string]: string }
}

/**
 * S3 Static Website construct
 * Creates S3 bucket optimized for static website hosting via CloudFront
 */
export class StaticWebsite extends Construct {
    // The S3 bucket for static assets
    public readonly bucket: Bucket;
    // Origin Access Control for CloudFront
    public readonly originAccessControl: CfnOriginAccessControl;

    constructor(scope: Construct, id: string, props: StaticWebsiteProps){
        super(scope, id)

        // Create S3 bucket for static website
        this.bucket = new Bucket(this, "WebsiteBucket", {
            // Globally unique bucket name
            bucketName: props.bucketName,

            // Block all public access (CloudFront will serve content)
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,

            // Enable versioning for rollback capability
            versioned: props.versioned || true,

            // Encryption at rest
            encryption: BucketEncryption.S3_MANAGED,

            // Enforce SSL/TLS for all requests
            enforceSSL: true,

            // Removal policy (be careful in production)
            removalPolicy: RemovalPolicy.RETAIN,
            
            // CORS configuration for web assets
            cors:[
                {
                    allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
                    allowedOrigins: ["*"], // CloudFront will restrict this
                    allowedHeaders: ["*"],
                    maxAge: 3600
                }
            ]
        })

        // Add lifecycle rules for cost optimization
        if(props.lifecycleRules ?? true) {
            this.bucket.addLifecycleRule({
                id: 'OptimizeStorage',
                enabled: true,
                // Move to Infrequent Access after 30 days
                transitions: [
                    {
                        storageClass: StorageClass.INFREQUENT_ACCESS,
                        transitionAfter: Duration.days(30)
                    }
                ],
                noncurrentVersionExpiration: Duration.days(90)
            })
        }

        // Create Origin Access Control for CloudFront
        this.originAccessControl = new CfnOriginAccessControl(this, 'OAC', {
            originAccessControlConfig: {
                name: `${props.bucketName}-oac`,
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
                description: `Origin Access Control for ${props.bucketName}`
            }
        })

        // Apply tags if provided
        if (props.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                Tags.of(this.bucket).add(key, value)
            })
        }

        // Output bucket information
        new CfnOutput(this, 'BucketArn', {
            value: this.bucket.bucketArn,
            description: 'S3 Bucket ARN',
            exportName: `${Stack.of(this).stackName}-BucketArn`
        })

        new CfnOutput(this, 'BucketName', {
            value: this.bucket.bucketName,
            description: 'S3 Bucket Name',
            exportName: `${Stack.of(this).stackName}-BucketName`
        })
    }
}
import { APP_NAME, AWS_REGIONS } from "../constants/aws";

// Development environment configuration
export const devConfig = {
    // Environment identifier
    environment: 'dev',
    // AWS account and region settings
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: AWS_REGIONS.PRIMARY,

    // Domain configuration (safe - won't affect production)
    domain: {
        // Use subdomain for development
        name: 'dev.yasmade.net',
        // Certificate region must be us-east-1 for CloudFront
        certificateRegion: AWS_REGIONS.CERTIFICATE,
        // Create hosted zone for dev subdomain
        createHostedZone: true
    },

    // S3 bucket names (must be globally unique)
    buckets: {
        // Static website hosting bucket
        staticWebsite: `${APP_NAME}-dev-static-website`,
        buildArtifacts: `${APP_NAME}-dev-build-artifacts`
    },

    // CloudFront settings for development
    cloudfront: {
        // Enable for development (can disable to save costs)
        enabled: true,
        // Comment for the distribution
        comment: 'YasMade Development Website Distribution',
        // Default root object
        defaultRootObject: 'index.html',
        // Error pages for SPA routing
        errorConfigurations: [
            {
                errorCode: 404,
                responseCode: 200,
                responsePagePath: '/index.html'
            },
            {
                errorCode: 403,
                responseCode: 200,
                responsePagePath: '/index.html'
            }
        ]
    },

    // Tags applied to all resources
    tags: {
        Environment: 'dev',
        Project: APP_NAME,
        Owner: 'elprince-dev',
    }


} as const
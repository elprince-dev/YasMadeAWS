// Environment configuration type definitions

// Domain configuration interface
export interface DomainConfig {
    readonly name: string;
    readonly certificateRegion: string;
    readonly createHostedZone: boolean;
}

// S3 bucket configuration interface
export interface BucketConfig {
    readonly staticWebsite: string;
    readonly buildArtifacts: string;
}

// CloudFront error configuration
export interface ErrorConfiguration {
    readonly errorCode: number;
    readonly responseCode: number;
    readonly responsePagePath: string;
}

// CloudFront configuration interface
export interface CloudFrontConfig {
    readonly enabled: boolean;
    readonly comment: string;
    readonly defaultRootObject: string;
    readonly errorConfigurations: ErrorConfiguration[];
}

// Resource tags interface
export interface ResourceTags {
    readonly Environment: string;
    readonly Project: string;
    readonly Owner: string;
    readonly [key: string]: string; // Allow additional tags
}

// Complete environment configuration interface
export interface EnvironmentConfig {
    readonly environment: string;
    readonly account: string | undefined;
    readonly region: string;
    readonly domain: DomainConfig;
    readonly bucket: BucketConfig;
    readonly cloudFront: CloudFrontConfig;
    readonly tags: ResourceTags;
}
// AWS-specific constants used across all infrastructure
export const APP_NAME = 'yasmade' as const
export const AWS_REGIONS = {
    // Primary region for most resources
    PRIMARY: 'us-east-1',
    // ACM certificates for CloudFront MUST be in us-east-1
    CERTIFICATE: "us-east-1"
} as const

// CloudFront distribution settings
export const CLOUDFRONT_SETTINGS = {
    // Price class controls global edge locations (cost vs performance)
    PRICE_CLASS: 'PriceClass_100', // US, Canada, Europe only
    // Cache TTL in seconds
    DEFAULT_TTL: 86400, // 24 hrs
    MAX_TTL: 31536000, // 1 year
    MIN_TTL: 0, // No minimum caching
    // Enable compression for better performance
    COMPRESS: true
} as const

// S3 bucket configuration
export const S3_SETTINGS = {
    // Block all public access (CloudFront will serve content)
    BLOCK_PUBLIC_ACCESS: true,
    // Enable versioning for rollback capability
    VERSIONED: true,
    // Lifecycle rules
    TRANSITION_TO_IA_DAYS: 30, //Move to Infrequent Access after 30 days
    EXPIRE_DAYS: 365 // Delete old versions after 1 year
} as const

// Resource naming patterns
export const NAMING = {
    // Prefix for all resources
    PREFIX: 'yasmade',
    // Maximum length for resource names
    MAX_LENGTH: 63,
    // Separator for all resources
    SEPARATOR: '-'
} as const

// Security headers for CloudFront responses
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Basic CSP for React apps
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
} as const

// Timeouts and limits
export const LIMITS = {
    // ACM certificate validation timeout (minutes)
    CERTIFICATE_VALIDATION_TIMEOUT: 10,
    // CloudFront deployment timeout (minutes)
    CLOUDFRONT_DEPLOYMENT_TIMEOUT: 30,
    // Maximum number of origins per distribution
    MAX_ORIGINS: 25
} as const
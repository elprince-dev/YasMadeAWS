# Static Hosting Stack - Theory & Concepts

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [S3 Static Website Hosting](#s3-static-website-hosting)
3. [Stack Dependencies](#stack-dependencies)
4. [Environment Configuration](#environment-configuration)
5. [Resource Management](#resource-management)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## Stack Overview

### Purpose

The Static Hosting Stack creates the foundational storage layer for your React application using Amazon S3. This stack is responsible for:

- **Static asset storage** - HTML, CSS, JavaScript, images, and other web assets
- **Versioning and lifecycle management** - Rollback capabilities and cost optimization
- **Security configuration** - Private bucket with proper access controls
- **Foundation for CDN** - Serves as origin for CloudFront distribution

### Architecture Position

```
Frontend Architecture:
1. Static Hosting Stack ← You are here
   ├── S3 Bucket (private)
   └── Lifecycle policies
2. CDN Stack (depends on #1)
   └── CloudFront distribution
3. DNS Stack (depends on #2)
   ├── SSL certificate
   └── Route53 records
```

### Stack Responsibilities

- ✅ **S3 bucket creation** - Globally unique bucket for static assets
- ✅ **Security hardening** - Block public access, encryption at rest
- ✅ **Cost optimization** - Lifecycle rules for old versions
- ✅ **Versioning** - Enable rollback to previous deployments
- ❌ **Public access** - Bucket remains private (CloudFront provides access)
- ❌ **DNS configuration** - Handled by DNS stack
- ❌ **SSL certificates** - Handled by DNS stack

## S3 Static Website Hosting

### Traditional vs CDN Approach

```
Traditional S3 Website Hosting:
S3 Bucket (public) → Direct user access
├── Website endpoint: bucket.s3-website.region.amazonaws.com
├── Public read permissions
└── Limited security and performance

CDN Approach (Our Implementation):
S3 Bucket (private) → CloudFront → Users
├── Origin Access Control for security
├── Global edge locations for performance
├── Custom domain with SSL
└── Advanced caching and security headers
```

### Why Private Bucket?

```typescript
// S3 bucket configuration
blockPublicAccess: BlockPublicAccess.BLOCK_ALL;
```

**Benefits:**

- ✅ **Enhanced security** - No direct public access to files
- ✅ **Access control** - Only CloudFront can access content
- ✅ **DDoS protection** - CloudFront shields origin from attacks
- ✅ **Cost optimization** - Reduced S3 request charges
- ✅ **Performance** - Global edge caching

**Trade-offs:**

- ❌ **Complexity** - Requires CloudFront setup
- ❌ **No direct access** - Can't access files directly via S3 URLs

## Stack Dependencies

### Input Dependencies

```typescript
export interface StaticHostingStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig;
}
```

**Required inputs:**

- **Environment configuration** - Bucket names, tags, lifecycle settings
- **AWS account/region** - Deployment target information

### Output Dependencies

```typescript
public readonly staticWebsite: StaticWebsite
```

**Provides to other stacks:**

- **S3 bucket reference** - Used by CDN stack as origin
- **Bucket ARN** - For cross-stack references and permissions
- **Bucket name** - For deployment scripts and CI/CD

### Cross-Stack References

```typescript
// Exported for other stacks
new CfnOutput(this, 'BucketName', {
  exportName: `${this.stackName}-BucketName`,
});

new CfnOutput(this, 'BucketArn', {
  exportName: `${this.stackName}-BucketArn`,
});
```

## Environment Configuration

### Bucket Naming Strategy

```typescript
// Environment-specific bucket names
buckets: {
  staticWebsite: 'yasmade-dev-static-website',    // Development
  staticWebsite: 'yasmade-prod-static-website'    // Production
}
```

**Naming requirements:**

- **Globally unique** - No two S3 buckets can have same name worldwide
- **DNS compliant** - Lowercase letters, numbers, hyphens only
- **Environment prefix** - Separate dev/staging/prod buckets
- **Descriptive** - Clear purpose identification

### Configuration Structure

```typescript
// From environment config
environmentConfig: {
  buckets: {
    staticWebsite: string,      // Bucket name
    buildArtifacts: string      // Future CI/CD artifacts
  },
  tags: {
    Environment: string,        // dev/staging/prod
    Project: string,           // Project identifier
    Owner: string             // Team/person responsible
  }
}
```

### Environment Isolation

```
Development Environment:
├── yasmade-dev-static-website
├── dev.yasmade.net domain
└── Separate CloudFront distribution

Production Environment:
├── yasmade-prod-static-website
├── yasmade.net domain
└── Separate CloudFront distribution
```

## Resource Management

### S3 Bucket Features

```typescript
// Bucket configuration
new Bucket(this, 'WebsiteBucket', {
  bucketName: props.environmentConfig.buckets.staticWebsite,
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  versioned: true,
  encryption: BucketEncryption.S3_MANAGED,
  enforceSSL: true,
  removalPolicy: RemovalPolicy.RETAIN,
});
```

### Versioning Benefits

```
Version Management:
├── Current version: index.html (v3)
├── Previous version: index.html (v2)
├── Older version: index.html (v1)
└── Rollback capability: Switch to any version
```

**Use cases:**

- **Deployment rollback** - Revert to previous working version
- **A/B testing** - Compare different versions
- **Audit trail** - Track all changes over time
- **Disaster recovery** - Restore from accidental deletion

### Lifecycle Management

```typescript
// Automatic cost optimization
addLifecycleRule({
  transitions: [
    {
      storageClass: StorageClass.INFREQUENT_ACCESS,
      transitionAfter: Duration.days(30),
    },
  ],
  noncurrentVersionExpiration: Duration.days(90),
});
```

**Cost optimization flow:**

1. **Day 0-30**: Standard storage (frequent access)
2. **Day 30+**: Infrequent Access storage (40% cheaper)
3. **Day 90+**: Old versions deleted automatically

### Security Configuration

```typescript
// Security hardening
encryption: BucketEncryption.S3_MANAGED,  // AES-256 encryption
enforceSSL: true,                         // HTTPS only
blockPublicAccess: BlockPublicAccess.BLOCK_ALL  // No public access
```

## Deployment Strategy

### Deployment Flow

```
1. Build React App
   ├── npm run build
   ├── Creates /build directory
   └── Static files ready

2. Deploy Stack
   ├── cdk deploy StaticHostingStack
   ├── Creates S3 bucket
   └── Configures security and lifecycle

3. Upload Assets
   ├── aws s3 sync build/ s3://bucket-name/
   ├── Files uploaded to S3
   └── Versioning creates new versions

4. CloudFront Integration
   ├── CDN stack references bucket
   ├── Origin Access Control configured
   └── Global distribution ready
```

### Blue-Green Deployment

```
Blue-Green Strategy:
├── Blue Environment (current)
│   ├── yasmade-prod-static-website
│   └── Active traffic
├── Green Environment (new)
│   ├── yasmade-staging-static-website
│   └── Testing new version
└── Switch: Update CloudFront origin
```

### Rollback Strategy

```typescript
// Rollback options
1. S3 Version Rollback
   ├── Identify previous working version
   ├── Copy version to current
   └── CloudFront cache invalidation

2. Stack Rollback
   ├── cdk deploy --rollback
   ├── Revert to previous stack state
   └── Automatic resource restoration
```

## Monitoring & Troubleshooting

### CloudWatch Metrics

```
S3 Bucket Metrics:
├── BucketSizeBytes - Storage usage
├── NumberOfObjects - File count
├── AllRequests - Request volume
└── 4xxErrors/5xxErrors - Error rates
```

### Cost Monitoring

```typescript
// Cost allocation tags
tags: {
  Environment: 'production',
  Project: 'yasmade-website',
  CostCenter: 'frontend'
}
```

**Cost tracking:**

- **Storage costs** - Based on data volume and storage class
- **Request costs** - GET, PUT, DELETE operations
- **Data transfer** - Outbound data transfer charges
- **Lifecycle transitions** - Costs for moving between storage classes

### Common Issues

#### Bucket Name Already Exists

**Problem**: S3 bucket names must be globally unique

```
Error: Bucket name 'my-website' already exists
```

**Solution**: Use environment-specific prefixes

```typescript
bucketName: `${organizationName}-${environment}-${purpose}`;
// Example: 'yasmade-dev-static-website'
```

#### Access Denied Errors

**Problem**: Bucket is private but something tries to access directly

```
Error: Access Denied when accessing S3 URL
```

**Solution**: This is expected behavior - access through CloudFront only

#### High Storage Costs

**Problem**: Old versions consuming storage

```
Cost Alert: S3 storage costs increased 300%
```

**Solution**: Verify lifecycle rules are working

```bash
aws s3api list-object-versions --bucket bucket-name
```

#### Deployment Failures

**Problem**: Stack deployment fails

```
Error: Bucket already exists in different region
```

**Solutions:**

- Check bucket name uniqueness
- Verify region configuration
- Ensure proper IAM permissions

### Debugging Commands

```bash
# Check bucket configuration
aws s3api get-bucket-location --bucket bucket-name
aws s3api get-bucket-versioning --bucket bucket-name
aws s3api get-bucket-lifecycle-configuration --bucket bucket-name

# List bucket contents
aws s3 ls s3://bucket-name --recursive

# Check bucket policy
aws s3api get-bucket-policy --bucket bucket-name

# Monitor costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Best Practices

### Naming Conventions

```
✅ Good naming:
yasmade-prod-static-website
yasmade-dev-static-website
company-env-purpose

❌ Bad naming:
my-bucket
website
prod-bucket
```

### Security Checklist

- ✅ Block all public access
- ✅ Enable encryption at rest
- ✅ Enforce SSL/TLS
- ✅ Use least privilege IAM policies
- ✅ Enable CloudTrail logging
- ✅ Regular security audits

### Cost Optimization

- ✅ Enable lifecycle rules
- ✅ Monitor storage usage
- ✅ Use appropriate storage classes
- ✅ Clean up old versions regularly
- ✅ Set up cost alerts

### Operational Excellence

- ✅ Use infrastructure as code (CDK)
- ✅ Environment-specific configurations
- ✅ Automated deployments
- ✅ Monitoring and alerting
- ✅ Disaster recovery planning

## Integration Examples

### Using in Main CDK App

```typescript
// Deploy static hosting stack
const staticHostingStack = new StaticHostingStack(app, 'StaticHosting', {
  environmentConfig: devConfig,
  env: { account: '123456789012', region: 'us-east-1' },
});

// Reference in CDN stack
const cdnStack = new CdnStack(app, 'CDN', {
  environmentConfig: devConfig,
  originBucket: staticHostingStack.staticWebsite.bucket,
});
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Deploy to S3
  run: |
    aws s3 sync build/ s3://${{ env.BUCKET_NAME }}/ --delete
    aws cloudfront create-invalidation --distribution-id ${{ env.DISTRIBUTION_ID }} --paths "/*"
```

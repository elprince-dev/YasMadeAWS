# Static Website S3 Construct - Theory & Concepts

## Table of Contents
1. [S3 Fundamentals](#s3-fundamentals)
2. [Origin Access Control (OAC)](#origin-access-control-oac)
3. [S3 Security & Best Practices](#s3-security--best-practices)
4. [Cost Optimization](#cost-optimization)
5. [CDK Construct Patterns](#cdk-construct-patterns)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## S3 Fundamentals

### What is Amazon S3?
- **Simple Storage Service** - Object storage for the internet
- **Globally unique bucket names** - bucket names must be unique across all AWS accounts
- **Virtually unlimited storage** - store any amount of data
- **11 9's durability** (99.999999999%) - extremely reliable
- **Multiple storage classes** - optimize costs based on access patterns

### S3 for Static Websites
- **Static content hosting** - HTML, CSS, JavaScript, images
- **No server management** - serverless architecture
- **Global distribution** - works with CloudFront CDN
- **Cost effective** - pay only for storage and requests
- **Scalable** - handles any amount of traffic when used with CloudFront

### S3 Bucket Structure
```
Bucket: yasmade-dev-static-website
├── index.html (React app entry point)
├── static/
│   ├── css/
│   │   └── main.abc123.css
│   ├── js/
│   │   └── main.def456.js
│   └── media/
│       └── logo.png
├── assets/
│   └── images/
└── favicon.ico
```

## Origin Access Control (OAC)

### What is OAC?
- **Secure access method** for CloudFront to access S3
- **Replaces Origin Access Identity (OAI)** - newer, more secure
- **AWS Signature Version 4** - stronger authentication
- **Fine-grained permissions** - precise access control

### Why Use OAC?
- ✅ **Enhanced security** - uses SigV4 authentication
- ✅ **Better performance** - optimized for CloudFront
- ✅ **Future-proof** - AWS recommended approach
- ✅ **Supports all S3 features** - including SSE-KMS encryption

### OAC vs OAI Comparison
| Feature | OAI (Legacy) | OAC (Current) |
|---------|--------------|---------------|
| Authentication | SigV2 | SigV4 |
| Security | Basic | Enhanced |
| S3 Encryption | Limited | Full support |
| Performance | Standard | Optimized |
| AWS Recommendation | Deprecated | Recommended |

### How OAC Works
1. **CloudFront requests object** from S3
2. **OAC signs request** with SigV4 authentication
3. **S3 validates signature** against bucket policy
4. **S3 serves content** to CloudFront
5. **CloudFront delivers** to end user

## S3 Security & Best Practices

### Block Public Access
```typescript
blockPublicAccess: BlockPublicAccess.BLOCK_ALL
```
- **Prevents accidental exposure** - no public read access
- **CloudFront-only access** - content served through CDN
- **Defense in depth** - multiple security layers
- **Compliance requirement** - meets security standards

### Encryption at Rest
```typescript
encryption: BucketEncryption.S3_MANAGED
```
- **AES-256 encryption** - industry standard
- **AWS managed keys** - no key management overhead
- **Transparent encryption** - automatic encrypt/decrypt
- **Compliance** - meets data protection requirements

### SSL/TLS Enforcement
```typescript
enforceSSL: true
```
- **HTTPS only** - rejects HTTP requests
- **Data in transit protection** - encrypted communication
- **Prevents downgrade attacks** - forces secure connections
- **Bucket policy enforcement** - automatic policy creation

### CORS Configuration
```typescript
cors: [{
  allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
  allowedOrigins: ['*'],
  allowedHeaders: ['*'],
  maxAge: 3600
}]
```
- **Cross-Origin Resource Sharing** - allows browser requests
- **GET/HEAD methods** - read-only access for static assets
- **Wildcard origins** - CloudFront will restrict this
- **Cache headers** - reduces preflight requests

## Cost Optimization

### S3 Storage Classes
| Class | Use Case | Cost | Retrieval |
|-------|----------|------|-----------|
| Standard | Frequently accessed | Higher | Immediate |
| IA (Infrequent Access) | Monthly access | Lower | Immediate |
| Glacier | Archival | Lowest | Minutes-hours |

### Lifecycle Rules
```typescript
lifecycleRules: {
  transitions: [{
    storageClass: StorageClass.INFREQUENT_ACCESS,
    transitionAfter: Duration.days(30)
  }],
  noncurrentVersionExpiration: Duration.days(90)
}
```

**Benefits:**
- **Automatic cost reduction** - moves old files to cheaper storage
- **Version cleanup** - deletes old versions automatically
- **No manual intervention** - set once, runs forever
- **Significant savings** - up to 40% cost reduction

### Versioning Benefits
```typescript
versioned: true
```
- **Rollback capability** - revert to previous deployments
- **Accidental deletion protection** - versions preserved
- **Change tracking** - history of all modifications
- **Blue/green deployments** - switch between versions

## CDK Construct Patterns

### Props Interface Design
```typescript
export interface StaticWebsiteProps {
  readonly bucketName: string        // Required
  readonly versioned?: boolean       // Optional with default
  readonly lifecycleRules?: boolean  // Optional with default
  readonly tags?: { [key: string]: string } // Optional
}
```

**Design Principles:**
- **Required vs Optional** - clear distinction
- **Sensible defaults** - minimize configuration
- **Type safety** - prevent runtime errors
- **Documentation** - self-documenting interfaces

### Nullish Coalescing Operator (??)
```typescript
if (props.lifecycleRules ?? true) {
  // Add lifecycle rules
}
```

**Why `??` instead of `||`:**
- `??` only triggers for `null`/`undefined`
- `||` triggers for any falsy value (`false`, `0`, `""`)
- Respects explicit `false` values from users
- Better for boolean optional properties

### Public Readonly Properties
```typescript
public readonly bucket: Bucket
public readonly originAccessControl: CfnOriginAccessControl
```

**Benefits:**
- **Composition** - other constructs can use these resources
- **Immutability** - prevents external modification
- **Type safety** - TypeScript knows exact types
- **IntelliSense** - IDE autocomplete support

### Resource Outputs
```typescript
new CfnOutput(this, 'BucketArn', {
  value: this.bucket.bucketArn,
  exportName: `${Stack.of(this).stackName}-BucketArn`
})
```

**Use Cases:**
- **Cross-stack references** - import in other stacks
- **External integrations** - CI/CD pipelines need ARNs
- **Debugging** - easy to find resource identifiers
- **Documentation** - self-documenting infrastructure

## Security Best Practices

### Bucket Security Checklist
- ✅ **Block public access** - prevent accidental exposure
- ✅ **Encryption at rest** - protect stored data
- ✅ **SSL enforcement** - secure data in transit
- ✅ **Least privilege access** - minimal required permissions
- ✅ **Access logging** - audit all requests
- ✅ **Versioning enabled** - protect against accidental changes

### CloudFront Integration Security
- ✅ **Origin Access Control** - secure S3 access
- ✅ **Custom domain with SSL** - professional appearance
- ✅ **Security headers** - protect against attacks
- ✅ **Geographic restrictions** - if needed for compliance

## Monitoring & Troubleshooting

### CloudWatch Metrics
- **BucketSizeBytes** - monitor storage usage
- **NumberOfObjects** - track object count
- **AllRequests** - monitor request patterns
- **4xxErrors/5xxErrors** - identify issues

### Common Issues

#### Bucket Name Already Exists
**Problem**: S3 bucket names must be globally unique
**Solution**: Use environment-specific prefixes (`yasmade-dev-`, `yasmade-prod-`)

#### Access Denied Errors
**Problem**: CloudFront can't access S3 objects
**Solution**: Verify OAC configuration and bucket policy

#### CORS Errors
**Problem**: Browser blocks requests to S3
**Solution**: Configure CORS policy for your domain

#### High Storage Costs
**Problem**: Old versions consuming storage
**Solution**: Enable lifecycle rules to clean up old versions

## Recommended Resources

### AWS Documentation
- [S3 User Guide](https://docs.aws.amazon.com/s3/latest/userguide/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/s3/latest/userguide/WebsiteHosting.html)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)

### Video Tutorials
- [S3 Deep Dive](https://www.youtube.com/watch?v=77lMCiiMilo) - AWS Official
- [S3 Security Best Practices](https://www.youtube.com/watch?v=x25FSsXrBqU) - AWS Security
- [CloudFront + S3 Setup](https://www.youtube.com/watch?v=mls8tiiI3uc) - Practical Tutorial

### Blog Posts
- [S3 Security Best Practices](https://aws.amazon.com/blogs/security/how-to-use-bucket-policies-and-apply-defense-in-depth-to-help-secure-your-amazon-s3-data/) - AWS Security Blog
- [S3 Cost Optimization](https://aws.amazon.com/blogs/storage/optimizing-amazon-s3-storage-costs-using-s3-storage-lens/) - AWS Storage Blog
# CDN Stack - Theory & Concepts

## Table of Contents
1. [Stack Overview](#stack-overview)
2. [CloudFront Distribution Architecture](#cloudfront-distribution-architecture)
3. [Stack Dependencies](#stack-dependencies)
4. [Cache Behavior Integration](#cache-behavior-integration)
5. [Custom Domain Configuration](#custom-domain-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Deployment & Management](#deployment--management)

## Stack Overview

### Purpose
The CDN Stack creates a global content delivery network using Amazon CloudFront. This stack transforms your private S3 bucket into a high-performance, globally distributed website with:

- **Global edge locations** - Content served from 400+ locations worldwide
- **Custom domain support** - Professional URLs with SSL certificates
- **Advanced caching** - Optimized performance for different file types
- **Security integration** - Origin Access Control and security headers
- **Error handling** - SPA routing support for React applications

### Architecture Position
```
Frontend Architecture:
1. Static Hosting Stack
   └── S3 Bucket (private)
2. CDN Stack ← You are here
   ├── CloudFront distribution
   ├── Origin Access Control
   ├── Cache behaviors
   └── Security headers
3. DNS Stack (depends on #2)
   ├── SSL certificate
   └── Route53 records
```

### Stack Responsibilities
- ✅ **CloudFront distribution** - Global CDN with edge locations
- ✅ **Origin configuration** - Secure connection to S3 bucket
- ✅ **Cache behaviors** - Optimized caching for different content types
- ✅ **Custom domain setup** - Integration with SSL certificates
- ✅ **Error responses** - SPA routing support (404 → index.html)
- ✅ **Performance optimization** - HTTP/2+3, compression, caching policies
- ❌ **SSL certificate creation** - Handled by DNS stack
- ❌ **DNS records** - Handled by DNS stack

## CloudFront Distribution Architecture

### Distribution Components
```
CloudFront Distribution:
├── Origins
│   └── S3 Bucket (with OAC)
├── Default Behavior
│   ├── Cache policy: CACHING_OPTIMIZED
│   ├── Viewer protocol: REDIRECT_TO_HTTPS
│   └── Allowed methods: GET, HEAD
├── Additional Behaviors
│   ├── /static/* → Long-term caching
│   ├── /service-worker.js → No caching
│   └── /api/* → No caching
├── Error Responses
│   ├── 404 → /index.html (SPA routing)
│   └── 403 → /index.html (SPA routing)
└── Custom Domain
    ├── Domain names: [example.com]
    └── SSL certificate: ACM certificate
```

### Origin Access Control (OAC)
```typescript
// Automatic OAC creation
const s3Origin = S3BucketOrigin.withOriginAccessControl(props.originBucket)
```

**How OAC works:**
1. **CloudFront requests** content from S3 bucket
2. **OAC signs request** with AWS Signature Version 4
3. **S3 validates signature** against bucket policy
4. **Content delivered** securely to CloudFront
5. **Users access content** through CloudFront only

**Security benefits:**
- ✅ **S3 bucket stays private** - No public access needed
- ✅ **Signed requests** - All requests authenticated
- ✅ **DDoS protection** - CloudFront shields S3 from attacks
- ✅ **Access logging** - Complete audit trail

## Stack Dependencies

### Input Dependencies
```typescript
export interface CdnStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig
  readonly originBucket: Bucket              // From Static Hosting Stack
  readonly certificate?: Certificate         // From DNS Stack (optional)
}
```

**Dependency flow:**
```
Static Hosting Stack → CDN Stack → DNS Stack
     (S3 bucket)    →  (CloudFront) → (SSL + DNS)
```

### Cross-Stack References
```typescript
// Imports from Static Hosting Stack
originBucket: props.originBucket

// Exports for DNS Stack
new CfnOutput(this, 'DistributionId', {
  exportName: `${this.stackName}-DistributionId`
})
```

### Optional Dependencies
```typescript
// SSL certificate (optional for development)
certificate: props.certificate,
domainNames: props.certificate ? [props.environmentConfig.domain.name] : undefined
```

**Development vs Production:**
- **Development**: No certificate, uses CloudFront domain
- **Production**: SSL certificate, uses custom domain

## Cache Behavior Integration

### Default Behavior
```typescript
defaultBehavior: {
  origin: s3Origin,
  viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
  cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  compress: true
}
```

**Applied to:**
- HTML files (index.html, 404.html)
- Root-level files without specific behaviors
- Any unmatched paths

### Additional Behaviors
```typescript
// Integrated from cdn-behaviors.ts configuration
const additionalBehaviors = getAllBehaviors()
```

**Behavior hierarchy:**
1. **Most specific**: `/service-worker.js` (no cache)
2. **Path patterns**: `/static/*`, `/assets/*`, `/api/*`
3. **Default behavior**: Everything else

### Cache Policy Mapping
| Content Type | Path Pattern | Cache Policy | TTL |
|--------------|--------------|--------------|-----|
| **HTML files** | Default | CACHING_OPTIMIZED | 24 hours |
| **Static assets** | `/static/*` | CACHING_OPTIMIZED_FOR_UNCOMPRESSED | 1 year |
| **General assets** | `/assets/*` | CACHING_OPTIMIZED | 24 hours |
| **Service worker** | `/service-worker.js` | CACHING_DISABLED | 0 seconds |
| **API calls** | `/api/*` | CACHING_DISABLED | 0 seconds |

## Custom Domain Configuration

### Domain Integration
```typescript
// Custom domain setup
domainNames: props.certificate ? [props.environmentConfig.domain.name] : undefined,
certificate: props.certificate
```

### Environment-Specific Domains
```
Development:
├── No custom domain
├── Uses: d123456.cloudfront.net
└── No SSL certificate needed

Production:
├── Custom domain: yasmade.net
├── SSL certificate from ACM
└── Professional appearance
```

### Domain Validation Flow
```
1. DNS Stack creates SSL certificate
2. Certificate validates via DNS records
3. CDN Stack receives validated certificate
4. CloudFront distribution configured with custom domain
5. DNS Stack creates A/AAAA records pointing to distribution
```

## Performance Optimization

### HTTP Protocol Support
```typescript
httpVersion: HttpVersion.HTTP2_AND_3
```

**Protocol benefits:**
- **HTTP/1.1**: Basic support, single request per connection
- **HTTP/2**: Multiplexing, server push, header compression
- **HTTP/3**: QUIC protocol, faster connection establishment, better mobile performance

### Compression Configuration
```typescript
compress: true  // For most behaviors
compress: false // For service worker and favicon
```

**Compression strategy:**
- ✅ **Text files**: HTML, CSS, JavaScript, JSON (70-90% reduction)
- ✅ **SVG images**: Vector graphics compress well
- ❌ **Binary files**: JPEG, PNG, WOFF2 already compressed
- ❌ **Small files**: Compression overhead not worth it

### Price Class Optimization
```typescript
priceClass: PriceClass.PRICE_CLASS_100  // US, Canada, Europe
```

**Price class options:**
| Class | Regions | Performance | Cost |
|-------|---------|-------------|------|
| **100** | US, Canada, Europe | Good for most sites | Lowest |
| **200** | + Asia Pacific | Better global performance | Medium |
| **All** | All edge locations | Best performance | Highest |

### Security Protocol
```typescript
minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021
```

**Security levels:**
- **TLS 1.2 (2021)**: Modern security, good compatibility
- **TLS 1.3**: Latest security, may have compatibility issues
- **TLS 1.1**: Legacy support, not recommended

## Deployment & Management

### Deployment Strategy
```
1. Deploy Static Hosting Stack
   ├── Creates S3 bucket
   └── Outputs bucket reference

2. Deploy CDN Stack
   ├── Creates CloudFront distribution
   ├── Configures origin and behaviors
   └── Outputs distribution information

3. Deploy DNS Stack (optional)
   ├── Creates SSL certificate
   ├── Updates CDN with custom domain
   └── Creates DNS records
```

### Stack Outputs
```typescript
// Critical outputs for other stacks and CI/CD
new CfnOutput(this, 'DistributionId', {
  value: this.cdnDistribution.distribution.distributionId,
  exportName: `${this.stackName}-DistributionId`
})

new CfnOutput(this, 'DistributionDomainName', {
  value: this.cdnDistribution.distribution.distributionDomainName,
  exportName: `${this.stackName}-DistributionDomainName`
})

new CfnOutput(this, 'DistributionUrl', {
  value: props.certificate 
    ? `https://${props.environmentConfig.domain.name}`
    : `https://${this.cdnDistribution.distribution.distributionDomainName}`,
  exportName: `${this.stackName}-WebsiteUrl`
})
```

### Cache Invalidation
```bash
# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id E123456789 \
  --paths "/index.html" "/service-worker.js"

# Invalidate everything (expensive)
aws cloudfront create-invalidation \
  --distribution-id E123456789 \
  --paths "/*"
```

**Invalidation strategy:**
- **Development**: Invalidate frequently for testing
- **Production**: Invalidate only when necessary (costs $0.005 per path)
- **Versioned assets**: No invalidation needed (new filenames)

### Monitoring & Metrics
```
CloudFront Metrics:
├── Requests - Total request count
├── BytesDownloaded - Data transfer volume
├── OriginLatency - Time to fetch from S3
├── CacheHitRate - Percentage served from cache
├── 4xxErrorRate - Client errors (404, 403)
└── 5xxErrorRate - Server errors (500, 502)
```

### Performance Monitoring
```typescript
// CloudWatch alarms for performance
new Alarm(this, 'HighOriginLatency', {
  metric: distribution.metricOriginLatency(),
  threshold: 1000, // 1 second
  evaluationPeriods: 2
})

new Alarm(this, 'LowCacheHitRate', {
  metric: distribution.metricCacheHitRate(),
  threshold: 80, // 80%
  comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD
})
```

## Error Handling & SPA Support

### Single Page Application Support
```typescript
errorResponses: props.environmentConfig.cloudFront.errorConfigurations
```

**Error configuration:**
```typescript
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
```

### Why This Works for React
```
Traditional Server:
/about → about.html ✅
/contact → contact.html ✅

React SPA Problem:
/about → 404 (file doesn't exist) ❌

React SPA Solution:
/about → 404 → redirect to /index.html → React Router handles /about ✅
```

### Error Response Flow
```
1. User visits example.com/about directly
2. CloudFront looks for /about file in S3
3. File doesn't exist → 404 error
4. Error response configuration triggers
5. CloudFront serves /index.html instead
6. Browser receives index.html with 200 status
7. React app loads and React Router handles /about route
```

## Common Issues & Solutions

### Distribution Not Updating
**Problem**: Changes to S3 not visible on website
**Cause**: CloudFront cache serving old content
**Solution**: Create cache invalidation
```bash
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"
```

### Custom Domain Not Working
**Problem**: Custom domain shows certificate errors
**Cause**: Certificate not properly associated or wrong region
**Solution**: Ensure certificate is in us-east-1 and properly referenced

### Slow Performance
**Problem**: Website loads slowly
**Cause**: Low cache hit rate or suboptimal cache policies
**Solution**: 
- Monitor cache hit rate metrics
- Optimize cache behaviors for your content
- Use versioned filenames for static assets

### SPA Routing Issues
**Problem**: Direct links to /about return 404
**Cause**: Missing error response configuration
**Solution**: Ensure error responses redirect 404/403 to index.html

### High Costs
**Problem**: Unexpected CloudFront charges
**Cause**: Too many cache invalidations or wrong price class
**Solution**:
- Use versioned assets to avoid invalidations
- Choose appropriate price class for your audience
- Monitor request patterns and optimize

## Best Practices

### Cache Strategy
```
✅ Long cache (1 year): Versioned assets (/static/*)
✅ Medium cache (24 hours): General content
✅ No cache: Dynamic content (/api/*, service worker)
✅ Invalidate sparingly: Use versioned filenames instead
```

### Security Headers
```
✅ HTTPS redirect: Force secure connections
✅ Security headers: XSS protection, clickjacking prevention
✅ HSTS: HTTP Strict Transport Security
✅ CSP: Content Security Policy for XSS prevention
```

### Performance Optimization
```
✅ Enable compression: For text-based files
✅ HTTP/2+3 support: Modern protocol benefits
✅ Appropriate price class: Balance cost vs performance
✅ Monitor metrics: Cache hit rate, origin latency
```

### Operational Excellence
```
✅ Infrastructure as code: CDK for reproducible deployments
✅ Environment separation: Different distributions for dev/prod
✅ Monitoring and alerting: CloudWatch alarms for key metrics
✅ Cost optimization: Regular review of usage patterns
```

## Integration Examples

### Complete Stack Integration
```typescript
// Main CDK app
const staticHostingStack = new StaticHostingStack(app, 'StaticHosting', {
  environmentConfig: devConfig
})

const cdnStack = new CdnStack(app, 'CDN', {
  environmentConfig: devConfig,
  originBucket: staticHostingStack.staticWebsite.bucket
})

const dnsStack = new DnsStack(app, 'DNS', {
  environmentConfig: devConfig,
  distribution: cdnStack.cdnDistribution.distribution
})

// Update CDN with certificate after DNS stack
cdnStack.addDependency(dnsStack)
```

### CI/CD Integration
```yaml
# Deploy and invalidate cache
- name: Deploy and Invalidate
  run: |
    # Upload new files
    aws s3 sync build/ s3://${{ env.BUCKET_NAME }}/ --delete
    
    # Invalidate only changed files
    aws cloudfront create-invalidation \
      --distribution-id ${{ env.DISTRIBUTION_ID }} \
      --paths "/index.html" "/service-worker.js"
```
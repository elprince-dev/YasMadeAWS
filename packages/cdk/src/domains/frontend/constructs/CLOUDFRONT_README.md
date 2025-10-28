# CloudFront CDN Distribution Construct - Theory & Concepts

## Table of Contents
1. [CloudFront Fundamentals](#cloudfront-fundamentals)
2. [Content Delivery Network (CDN) Concepts](#content-delivery-network-cdn-concepts)
3. [Cache Behaviors & Policies](#cache-behaviors--policies)
4. [Origin Access Control (OAC)](#origin-access-control-oac)
5. [Single Page Application (SPA) Support](#single-page-application-spa-support)
6. [Performance Optimization](#performance-optimization)
7. [Security Features](#security-features)
8. [CDK Construct Design Patterns](#cdk-construct-design-patterns)

## CloudFront Fundamentals

### What is Amazon CloudFront?
- **Global Content Delivery Network (CDN)** - Delivers content from edge locations worldwide
- **Low latency** - Content served from nearest geographic location to users
- **High availability** - Built-in redundancy and failover capabilities
- **Scalable** - Automatically handles traffic spikes without configuration
- **Cost effective** - Pay only for data transfer and requests

### How CloudFront Works
```
User Request Flow:
1. User requests www.example.com/app.js
2. DNS routes to nearest CloudFront edge location
3. Edge location checks cache for app.js
4. If cached: Serves immediately (cache hit)
5. If not cached: Fetches from S3 origin (cache miss)
6. Edge caches content for future requests
7. Content delivered to user
```

### CloudFront Architecture
```
Internet Users
       ↓
CloudFront Edge Locations (400+ worldwide)
       ↓
Regional Edge Caches (13 locations)
       ↓
Origin (S3 Bucket)
```

## Content Delivery Network (CDN) Concepts

### Edge Locations
- **Physical servers** distributed globally
- **Cache content** closer to users
- **Reduce latency** by serving from nearby locations
- **400+ edge locations** across 90+ cities worldwide

### Cache Hit vs Cache Miss
| Scenario | Description | Performance | Cost |
|----------|-------------|-------------|------|
| **Cache Hit** | Content found in edge cache | Fast (1-10ms) | Low |
| **Cache Miss** | Must fetch from origin | Slower (100-500ms) | Higher |
| **Cache Refresh** | Content expired, refetch needed | Medium | Medium |

### Time To Live (TTL)
```typescript
// Different TTL strategies
cachePolicy: CachePolicy.CACHING_OPTIMIZED        // 24 hours default
cachePolicy: CachePolicy.CACHING_DISABLED         // No caching
cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS // 1 year
```

**TTL Best Practices:**
- **Static assets** (CSS, JS, images): Long TTL (1 year)
- **HTML files**: Short TTL (5 minutes) or no cache
- **API responses**: Very short TTL (1 minute) or no cache
- **Service workers**: No cache (immediate updates)

## Cache Behaviors & Policies

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

**Explanation:**
- **origin**: Where to fetch content from (S3 bucket)
- **viewerProtocolPolicy**: Force HTTPS for security
- **allowedMethods**: Only GET/HEAD for static sites
- **cachePolicy**: How long to cache content
- **compress**: Gzip compression for faster delivery

### Additional Behaviors (Path-based Routing)
```typescript
additionalBehaviors: {
  '/static/*': {
    // Cache static assets for 1 year
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    compress: true
  },
  '/service-worker.js': {
    // Never cache service worker
    cachePolicy: CachePolicy.CACHING_DISABLED,
    compress: false
  }
}
```

**Path Patterns:**
- **`/static/*`** - Matches `/static/css/main.css`, `/static/js/app.js`
- **`*.jpg`** - Matches all JPEG images
- **`/api/*`** - Matches all API endpoints
- **Order matters** - More specific patterns first

### Cache Policies Explained

| Policy | Use Case | TTL | Best For |
|--------|----------|-----|----------|
| `CACHING_OPTIMIZED` | Static websites | 24 hours | HTML, general content |
| `CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS` | Static assets | 1 year | CSS, JS, images |
| `CACHING_DISABLED` | Dynamic content | 0 seconds | APIs, service workers |

## Origin Access Control (OAC)

### What is OAC?
```typescript
const s3Origin = S3BucketOrigin.withOriginAccessControl(props.originBucket)
```

- **Secure access method** - CloudFront accesses S3 without public permissions
- **Replaces OAI** - Origin Access Identity (deprecated)
- **AWS Signature V4** - Strong authentication
- **Automatic setup** - CDK handles configuration

### Security Benefits
- ✅ **S3 bucket stays private** - No public read permissions needed
- ✅ **Direct S3 access blocked** - Users must go through CloudFront
- ✅ **Signed requests** - All requests authenticated
- ✅ **Fine-grained control** - Specific permissions per distribution

### How OAC Works
```
1. User requests content from CloudFront
2. CloudFront signs request with OAC credentials
3. S3 validates signature against bucket policy
4. S3 serves content to CloudFront (if authorized)
5. CloudFront delivers content to user
```

## Single Page Application (SPA) Support

### The SPA Problem
```
Traditional Server:
/about → about.html ✅
/contact → contact.html ✅

React SPA:
/about → index.html (React Router handles routing) ✅
/contact → index.html (React Router handles routing) ✅
Direct access to /about → 404 Error ❌
```

### Error Response Solution
```typescript
errorResponses: [
  {
    httpStatus: 404,
    responseHttpStatus: 200,
    responsePagePath: '/index.html'
  },
  {
    httpStatus: 403,
    responseHttpStatus: 200,
    responsePagePath: '/index.html'
  }
]
```

**How it works:**
1. User visits `example.com/about` directly
2. CloudFront looks for `/about` file in S3
3. File doesn't exist → 404 error
4. Error response redirects to `/index.html`
5. React app loads and handles `/about` route

### SPA Best Practices
- ✅ **Always redirect 404/403 to index.html**
- ✅ **Don't cache index.html** (for updates)
- ✅ **Cache static assets with versioned names**
- ✅ **Use React Router or similar for client-side routing**

## Performance Optimization

### HTTP Versions
```typescript
httpVersion: HttpVersion.HTTP2_AND_3
```

**Benefits:**
- **HTTP/2**: Multiplexing, server push, header compression
- **HTTP/3**: QUIC protocol, faster connection establishment
- **Backward compatibility**: Falls back to HTTP/1.1 if needed

### Compression
```typescript
compress: true
```

**What gets compressed:**
- ✅ **Text files**: HTML, CSS, JavaScript, JSON
- ✅ **Fonts**: WOFF, WOFF2, TTF
- ❌ **Images**: Already compressed (JPEG, PNG, WebP)
- ❌ **Videos**: Already compressed

**Compression benefits:**
- **70-90% size reduction** for text files
- **Faster page loads** - less data to transfer
- **Lower bandwidth costs** - reduced data transfer
- **Better user experience** - especially on mobile

### Price Classes
```typescript
priceClass: PriceClass.PRICE_CLASS_100  // US, Canada, Europe
```

| Price Class | Regions | Use Case | Cost |
|-------------|---------|----------|------|
| `PRICE_CLASS_100` | US, Canada, Europe | Most websites | Lowest |
| `PRICE_CLASS_200` | + Asia Pacific | Global audience | Medium |
| `PRICE_CLASS_ALL` | All edge locations | Maximum performance | Highest |

## Security Features

### HTTPS Enforcement
```typescript
viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
```

**Options:**
- `REDIRECT_TO_HTTPS` - Redirect HTTP to HTTPS (recommended)
- `HTTPS_ONLY` - Block HTTP requests entirely
- `ALLOW_ALL` - Allow both HTTP and HTTPS (not recommended)

### TLS/SSL Configuration
```typescript
minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021
```

**Security levels:**
- `TLS_V1_2_2021` - Modern security (recommended)
- `TLS_V1_2_2019` - Good compatibility
- `TLS_V1_1_2016` - Legacy support (not recommended)

### Custom Domain Security
```typescript
domainNames: props.domainNames,
certificate: props.certificate
```

**Benefits:**
- **Professional appearance** - `example.com` vs `d123456.cloudfront.net`
- **SSL certificate validation** - Proves domain ownership
- **SEO benefits** - Search engines prefer custom domains
- **User trust** - Users trust familiar domain names

## CDK Construct Design Patterns

### Props Interface Design
```typescript
export interface CdnDistributionProps {
  readonly originBucket: Bucket           // Required - varies per environment
  readonly certificate?: Certificate      // Optional - dev might not have SSL
  readonly domainNames?: string[]         // Optional - dev might use CloudFront domain
  readonly comment: string               // Required - documentation
  readonly defaultRootObject: string     // Required - usually 'index.html'
  readonly errorConfigurations: ErrorResponse[]  // Required - SPA routing
  readonly tags?: { [key: string]: string }     // Optional - resource tagging
}
```

### Opinionated Defaults
```typescript
// Hardcoded best practices (not in props)
viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS  // Always secure
allowedMethods: AllowedMethods.ALLOW_GET_HEAD                // Static sites only
compress: true                                               // Always optimize
httpVersion: HttpVersion.HTTP2_AND_3                        // Modern protocols
```

**Design Philosophy:**
- **Make the right thing easy** - Secure defaults
- **Make the wrong thing hard** - Can't accidentally misconfigure
- **Opinionated but flexible** - Good defaults, configurable where needed

### Public Readonly Properties
```typescript
public readonly distribution: Distribution
```

**Benefits:**
- **Composition** - Other constructs can reference this distribution
- **Cross-stack references** - Export distribution ID/domain
- **Testing** - Unit tests can verify distribution properties
- **Debugging** - Easy access to CloudFormation properties

### Resource Outputs
```typescript
new CfnOutput(this, 'DistributionId', {
  value: this.distribution.distributionId,
  exportName: `${Stack.of(this).stackName}-DistributionId`
})
```

**Use Cases:**
- **CI/CD pipelines** - Need distribution ID for cache invalidation
- **DNS configuration** - Need domain name for Route53 records
- **Monitoring** - CloudWatch alarms reference distribution ID
- **Cross-stack dependencies** - Other stacks import these values

## Performance Monitoring

### CloudWatch Metrics
- **Requests** - Total number of requests
- **BytesDownloaded** - Data transfer volume
- **OriginLatency** - Time to fetch from S3
- **CacheHitRate** - Percentage of requests served from cache
- **4xxErrorRate** - Client errors (404, 403)
- **5xxErrorRate** - Server errors (500, 502)

### Optimization Strategies
1. **Increase cache hit rate** - Longer TTLs for static assets
2. **Reduce origin latency** - Optimize S3 bucket location
3. **Monitor error rates** - Fix broken links and missing files
4. **Analyze request patterns** - Identify popular content for pre-warming

## Common Issues & Solutions

### Cache Invalidation
**Problem**: Updated files not showing for users
**Solution**: Create CloudFront invalidation for changed files
```bash
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"
```

### SPA Routing Issues
**Problem**: Direct links to `/about` return 404
**Solution**: Configure error responses to redirect to index.html

### Slow Initial Load
**Problem**: First visit is slow (cache miss)
**Solution**: Pre-warm cache or use shorter TTLs for critical files

### Mixed Content Warnings
**Problem**: HTTPS site loading HTTP resources
**Solution**: Ensure all resources use HTTPS or protocol-relative URLs

## Recommended Resources

### AWS Documentation
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [CloudFront Caching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-behavior-overview.html)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)

### Video Tutorials
- [CloudFront Deep Dive](https://www.youtube.com/watch?v=AT-nHW3_SVI) - AWS Official
- [CDN Explained](https://www.youtube.com/watch?v=Bsq5cKkS33I) - Practical Overview
- [CloudFront Performance](https://www.youtube.com/watch?v=btNNWpKEHpE) - Optimization Tips

### Blog Posts
- [CloudFront Best Practices](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-announces-cache-and-origin-request-policies/) - AWS Blog
- [SPA Deployment Guide](https://aws.amazon.com/blogs/compute/building-a-ci-cd-pipeline-for-single-page-applications-with-aws-codebuild-and-aws-codepipeline/) - AWS Compute Blog
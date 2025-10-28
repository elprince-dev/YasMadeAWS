# Frontend Constructs - Theory & Concepts

## Table of Contents
1. [SSL Certificate Construct](#ssl-certificate-construct)
2. [Static Website S3 Construct](#static-website-s3-construct)
3. [S3 Fundamentals](#s3-fundamentals)
4. [Origin Access Control (OAC)](#origin-access-control-oac)
5. [S3 Security & Best Practices](#s3-security--best-practices)
6. [Cost Optimization](#cost-optimization)
7. [CDK Construct Patterns](#cdk-construct-patterns)

---

# SSL Certificate Construct

## SSL/TLS Fundamentals

### What is SSL/TLS?
- **SSL (Secure Sockets Layer)** / **TLS (Transport Layer Security)** encrypts data between browser and server
- **HTTPS** = HTTP over TLS/SSL
- Prevents man-in-the-middle attacks and data interception
- Required for modern web applications (browsers show warnings without it)

### How SSL Certificates Work
1. **Certificate Authority (CA)** issues certificates after verifying domain ownership
2. **Public Key Infrastructure (PKI)** - certificates contain public keys
3. **Certificate Chain** - Root CA → Intermediate CA → Your Certificate
4. **Browser Trust** - browsers have built-in list of trusted CAs

### Certificate Components
```
Certificate Contains:
├── Domain Name (Common Name)
├── Subject Alternative Names (SANs)
├── Public Key
├── Digital Signature (from CA)
├── Validity Period (start/end dates)
├── Key Algorithm (RSA, ECDSA)
└── Certificate Authority Info
```

## AWS Certificate Manager (ACM)

### What is ACM?
- **Free SSL certificates** for AWS services
- **Automatic renewal** - no manual intervention needed
- **Integration** with CloudFront, ALB, API Gateway
- **Regional service** - certificates are region-specific

### ACM Benefits
- ✅ **Free** - no cost for certificates
- ✅ **Auto-renewal** - renews 60 days before expiry
- ✅ **AWS Integration** - works seamlessly with AWS services
- ✅ **Wildcard support** - `*.example.com` certificates
- ✅ **Multiple domains** - Subject Alternative Names (SANs)

### ACM Limitations
- ❌ **AWS services only** - can't export private keys for external use
- ❌ **Region-specific** - CloudFront requires `us-east-1`
- ❌ **Domain validation required** - must prove domain ownership

## DNS Validation Process

### Why DNS Validation?
- **Automatic** - no manual email verification
- **Programmatic** - works with Infrastructure as Code
- **Fast** - validation completes in minutes
- **Reliable** - no dependency on email delivery

### How DNS Validation Works
1. **Request Certificate** - specify domain name
2. **ACM Creates CNAME Record** - unique validation record
3. **Route53 Adds Record** - automatically if using Route53
4. **ACM Validates** - checks DNS record exists
5. **Certificate Issued** - ready for use

### DNS Validation Example
```
Domain: example.com
ACM creates: _abc123.example.com CNAME _def456.acm-validations.aws
Route53 adds this record automatically
ACM verifies record exists → Certificate issued
```

## Subject Alternative Names (SAN)

### What are SANs?
- **Multiple domains** in one certificate
- **www and non-www** - covers both `example.com` and `www.example.com`
- **Subdomains** - can include `api.example.com`, `blog.example.com`
- **Cost effective** - one certificate for multiple domains

### Our SAN Configuration
```typescript
subjectAlternativeNames: [`www.${props.domainName}`]
```
- **Primary domain**: `example.com`
- **SAN domain**: `www.example.com`
- **Result**: One certificate covers both domains

### Why Include www?
- **User behavior** - some users type `www.example.com`
- **SEO** - prevents duplicate content issues
- **Redirects** - can redirect www to non-www or vice versa
- **Flexibility** - covers all common access patterns

## CloudFront Certificate Requirements

### Regional Requirement
```typescript
// Certificate MUST be in us-east-1 for CloudFront
readonly region: string // Must be 'us-east-1'
```

### Why us-east-1?
- **CloudFront global service** - edge locations worldwide
- **Certificate replication** - AWS replicates from us-east-1 globally
- **Historical reason** - CloudFront was built when us-east-1 was primary region
- **No exceptions** - this is a hard requirement

### Certificate Usage in CloudFront
1. **Custom domain** - `example.com` instead of `d123456.cloudfront.net`
2. **HTTPS termination** - CloudFront handles SSL/TLS
3. **Edge optimization** - certificates cached at edge locations
4. **SNI support** - Server Name Indication for multiple certificates

## CDK Construct Patterns

### Construct Structure
```typescript
export class SslCertificate extends Construct {
  public readonly certificate: Certificate // Expose for other constructs
  
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id) // Call parent constructor
    // Create resources
  }
}
```

### Key Patterns Explained

#### 1. Props Interface
```typescript
export interface SslCertificateProps {
  readonly domainName: string // Immutable properties
}
```
- **Readonly** - prevents accidental modification
- **Interface** - type safety and documentation
- **Separation** - props separate from implementation

#### 2. Public Readonly Properties
```typescript
public readonly certificate: Certificate
```
- **Public** - other constructs can access
- **Readonly** - prevents external modification
- **Typed** - TypeScript knows exact type

#### 3. CfnOutput for Cross-Stack References
```typescript
new CfnOutput(this, 'CertificateArn', {
  exportName: `${Stack.of(this).stackName}-CertificateArn`
})
```
- **Cross-stack** - other stacks can import this value
- **CloudFormation export** - creates CF export
- **Unique names** - includes stack name to prevent conflicts

#### 4. Tagging Pattern
```typescript
if (props.tags) {
  Object.entries(props.tags).forEach(([key, value]) => {
    Tags.of(this.certificate).add(key, value)
  })
}
```
- **Conditional tagging** - only if tags provided
- **Resource-specific** - tags applied to certificate
- **Cost tracking** - enables AWS cost allocation

## Security Best Practices

### Certificate Security
- ✅ **RSA 2048-bit keys** - industry standard
- ✅ **Automatic renewal** - prevents expiry
- ✅ **DNS validation** - secure validation method
- ✅ **SAN certificates** - covers multiple domains

### AWS Security
- ✅ **IAM permissions** - least privilege access
- ✅ **CloudTrail logging** - audit certificate operations
- ✅ **Resource tagging** - track certificate usage
- ✅ **Regional isolation** - certificates in specific regions

### Monitoring & Alerts
```typescript
// Future: Add CloudWatch alarms for certificate expiry
// ACM automatically renews, but monitoring is good practice
```

## Recommended Resources

### AWS Documentation
- [ACM User Guide](https://docs.aws.amazon.com/acm/latest/userguide/)
- [CloudFront Custom SSL](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [Route53 DNS Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)

### Video Tutorials
- [AWS ACM Deep Dive](https://www.youtube.com/watch?v=8Z7k8I1lNkE) - AWS Official
- [SSL/TLS Explained](https://www.youtube.com/watch?v=SJJmoDZ3il8) - Practical TLS
- [CDK Constructs Best Practices](https://www.youtube.com/watch?v=9As_ZIjUGmY) - AWS CDK Workshop

### Blog Posts
- [ACM Best Practices](https://aws.amazon.com/blogs/security/how-to-use-aws-certificate-manager-with-aws-config/) - AWS Security Blog
- [CloudFront SSL Setup](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-announces-support-for-wildcard-ssl-certificates/) - AWS Networking Blog

## Common Issues & Solutions

### Certificate Validation Stuck
**Problem**: DNS validation takes too long
**Solution**: Check Route53 hosted zone has correct NS records

### Wrong Region Error
**Problem**: Certificate not in us-east-1
**Solution**: Ensure certificate stack deployed to us-east-1

### Domain Mismatch
**Problem**: Certificate domain doesn't match CloudFront domain
**Solution**: Verify domain names match exactly (including www)

### Permission Errors
**Problem**: CDK can't create certificate
**Solution**: Ensure IAM user has ACM and Route53 permissions
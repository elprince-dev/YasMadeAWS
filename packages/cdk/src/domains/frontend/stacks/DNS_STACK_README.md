# DNS Stack - Theory & Concepts

## Table of Contents
1. [Stack Overview](#stack-overview)
2. [SSL Certificate Management](#ssl-certificate-management)
3. [DNS Configuration](#dns-configuration)
4. [Regional Deployment Strategy](#regional-deployment-strategy)
5. [Domain Migration Process](#domain-migration-process)
6. [Stack Dependencies](#stack-dependencies)
7. [Security & Compliance](#security--compliance)

## Stack Overview

### Purpose
The DNS Stack is the final piece of the frontend infrastructure, responsible for:

- **SSL certificate creation** - ACM certificates with automatic DNS validation
- **DNS management** - Route53 hosted zones and DNS records
- **Custom domain integration** - Professional URLs for your application
- **Security compliance** - HTTPS enforcement and certificate management
- **Domain migration** - Seamless transition from existing DNS providers

### Architecture Position
```
Frontend Architecture:
1. Static Hosting Stack
   └── S3 Bucket (private)
2. CDN Stack
   └── CloudFront distribution
3. DNS Stack ← You are here
   ├── SSL certificate (ACM)
   ├── Hosted zone (Route53)
   ├── DNS records (A, AAAA)
   └── Domain validation
```

### Stack Responsibilities
- ✅ **SSL certificate creation** - ACM certificates with DNS validation
- ✅ **Hosted zone management** - Route53 DNS zone creation
- ✅ **DNS record configuration** - A/AAAA records pointing to CloudFront
- ✅ **Domain validation** - Automatic certificate validation via DNS
- ✅ **WWW subdomain support** - Both example.com and www.example.com
- ✅ **Cross-region deployment** - Certificate in us-east-1 for CloudFront
- ❌ **Domain registration** - Assumes domain already registered elsewhere
- ❌ **Email configuration** - MX records handled separately if needed

## SSL Certificate Management

### ACM Certificate Creation
```typescript
this.sslCertificate = new SslCertificate(this, 'SslCertificate', {
  domainName: props.environmentConfig.domain.name,
  hostedZone: this.hostedZone,
  region: props.environmentConfig.domain.certificateRegion,
  tags: props.environmentConfig.tags
})
```

### Certificate Features
```
SSL Certificate:
├── Primary domain: example.com
├── Subject Alternative Name: www.example.com
├── Validation method: DNS validation
├── Key algorithm: RSA 2048-bit
├── Auto-renewal: Enabled (60 days before expiry)
└── Region: us-east-1 (required for CloudFront)
```

### DNS Validation Process
```
Certificate Validation Flow:
1. Request certificate for example.com
2. ACM generates validation CNAME record
   ├── Name: _abc123.example.com
   └── Value: _def456.acm-validations.aws
3. Route53 automatically adds CNAME record
4. ACM validates domain ownership
5. Certificate issued and ready for use
6. CloudFront can use certificate for HTTPS
```

### Why DNS Validation?
```
DNS Validation vs Email Validation:
├── DNS Validation ✅
│   ├── Automatic process
│   ├── No manual intervention
│   ├── Works with infrastructure as code
│   └── Faster validation (minutes)
└── Email Validation ❌
    ├── Manual email verification
    ├── Requires human intervention
    ├── Slower process (hours/days)
    └── Not suitable for automation
```

## DNS Configuration

### Hosted Zone Creation
```typescript
this.domainSetup = new DomainSetup(this, 'DomainSetup', {
  domainName: props.environmentConfig.domain.name,
  distribution: props.distribution,
  createHostedZone: props.environmentConfig.domain.createHostedZone,
  includeWwwRedirect: true
})
```

### DNS Record Structure
```
Route53 Hosted Zone: example.com
├── SOA Record (Start of Authority)
├── NS Records (Name Servers) - 4 AWS name servers
├── A Record: example.com → CloudFront distribution (IPv4)
├── AAAA Record: example.com → CloudFront distribution (IPv6)
└── A Record: www.example.com → CloudFront distribution (IPv4)
```

### Alias Records vs CNAME
```typescript
// Alias record (AWS-specific, better performance)
target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution))
```

**Why Alias Records:**
- ✅ **Works with apex domain** - Can use example.com (not possible with CNAME)
- ✅ **No additional DNS queries** - Direct resolution to IP addresses
- ✅ **No query charges** - AWS doesn't charge for alias record queries
- ✅ **Automatic IP updates** - AWS updates IPs automatically when CloudFront changes
- ✅ **Health checks** - Automatic failover if CloudFront is unhealthy

### IPv4 and IPv6 Support
```typescript
// IPv4 support (A record)
this.aRecord = new ARecord(this, 'ARecord', {
  target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution))
})

// IPv6 support (AAAA record)
this.aaaaRecord = new AaaaRecord(this, 'AAAARecord', {
  target: RecordTarget.fromAlias(new CloudFrontTarget(props.distribution))
})
```

**Dual-stack benefits:**
- ✅ **Maximum compatibility** - Works with all internet users
- ✅ **Future-proofing** - Ready for IPv6 adoption
- ✅ **Performance optimization** - Clients use fastest available protocol
- ✅ **Redundancy** - Fallback if one protocol fails

## Regional Deployment Strategy

### Cross-Region Requirements
```typescript
constructor(scope: Construct, id: string, props: DnsStackProps) {
  super(scope, id, {
    ...props,
    // Certificate MUST be in us-east-1 for CloudFront
    env: {
      account: props.environmentConfig.account,
      region: props.environmentConfig.domain.certificateRegion  // us-east-1
    }
  })
}
```

### Why us-east-1 for Certificates?
```
CloudFront Certificate Requirements:
├── Historical reason: CloudFront was built when us-east-1 was primary
├── Global replication: AWS replicates certificates from us-east-1 globally
├── Edge location access: All edge locations can access us-east-1 certificates
└── No exceptions: This is a hard AWS requirement
```

### Multi-Region Deployment Strategy
```
Application Architecture:
├── Primary Application Stack
│   ├── Region: us-west-2 (or your preferred region)
│   ├── S3 bucket, CloudFront distribution
│   └── Application resources
└── DNS Stack
    ├── Region: us-east-1 (required for certificate)
    ├── ACM certificate
    └── Route53 hosted zone (global service)
```

### Environment-Specific Regions
```typescript
// Development environment
env: {
  account: '123456789012',
  region: 'us-east-1'  // Certificate region
}

// Production environment  
env: {
  account: '987654321098',
  region: 'us-east-1'  // Certificate region
}
```

## Domain Migration Process

### Pre-Migration Setup
```
Current State (Namecheap):
├── Domain registered: example.com
├── DNS managed by: Namecheap DNS
├── Name servers: ns1.namecheap.com, ns2.namecheap.com
└── Website hosted: Netlify

Target State (AWS):
├── Domain registered: Namecheap (unchanged)
├── DNS managed by: Route53
├── Name servers: AWS Route53 name servers
└── Website hosted: CloudFront + S3
```

### Migration Steps
```
1. Deploy DNS Stack
   ├── Creates Route53 hosted zone
   ├── Creates SSL certificate
   ├── Validates certificate via DNS
   └── Outputs name servers

2. Update Domain Registrar
   ├── Login to Namecheap account
   ├── Navigate to domain management
   ├── Update name servers to Route53 values
   └── Save changes

3. Verify DNS Propagation
   ├── Check DNS resolution globally
   ├── Verify SSL certificate works
   ├── Test website functionality
   └── Monitor for 24-48 hours

4. Cleanup Old Resources
   ├── Remove Netlify deployment
   ├── Cancel old DNS services
   └── Update documentation
```

### DNS Propagation Timeline
```
DNS Propagation Schedule:
├── 0-15 minutes: Route53 servers updated
├── 15 minutes-2 hours: Most ISPs see changes
├── 2-24 hours: 95% of internet sees changes
├── 24-48 hours: 99.9% propagation complete
└── 48-72 hours: 100% guaranteed propagation
```

### Rollback Strategy
```
Emergency Rollback:
1. Revert name servers at registrar
   ├── Change back to original name servers
   ├── DNS reverts to previous configuration
   └── Website accessible via old setup

2. Investigate and fix issues
   ├── Debug DNS stack problems
   ├── Fix certificate issues
   └── Test thoroughly

3. Re-attempt migration
   ├── Deploy fixed DNS stack
   ├── Update name servers again
   └── Monitor carefully
```

## Stack Dependencies

### Input Dependencies
```typescript
export interface DnsStackProps extends StackProps {
  readonly environmentConfig: EnvironmentConfig
  readonly distribution: Distribution  // From CDN Stack
}
```

### Dependency Chain
```
Deployment Order:
1. Static Hosting Stack (independent)
2. CDN Stack (depends on #1)
3. DNS Stack (depends on #2)

Cross-Stack References:
├── DNS Stack needs CloudFront distribution
├── CDN Stack can optionally use SSL certificate
└── Circular dependency avoided by optional certificate
```

### Circular Dependency Resolution
```
Problem: CDN needs certificate, DNS needs distribution

Solution: Two-phase deployment
├── Phase 1: Deploy CDN without certificate
├── Phase 2: Deploy DNS with certificate
└── Phase 3: Update CDN with certificate (manual or automated)
```

### Stack Outputs
```typescript
// Critical outputs for integration and debugging
new CfnOutput(this, 'CertificateArn', {
  value: this.sslCertificate.certificate.certificateArn,
  exportName: `${this.stackName}-CertificateArn`
})

new CfnOutput(this, 'NameServers', {
  value: Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
  description: 'Route53 Name Servers (update in domain registrar)',
  exportName: `${this.stackName}-NameServers`
})
```

## Security & Compliance

### Certificate Security
```
SSL Certificate Security:
├── RSA 2048-bit encryption (industry standard)
├── SHA-256 signature algorithm
├── Automatic renewal (60 days before expiry)
├── DNS validation (secure validation method)
└── AWS managed private keys (never exposed)
```

### DNS Security
```
Route53 Security Features:
├── DNSSEC support (optional)
├── Query logging for audit trails
├── IAM-based access control
├── CloudTrail integration
└── DDoS protection (AWS Shield)
```

### Compliance Considerations
```
Security Standards:
├── TLS 1.2+ enforcement
├── HSTS header implementation
├── Certificate transparency logging
├── Regular security audits
└── Incident response procedures
```

### Access Control
```typescript
// IAM policy for DNS management
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:GetHostedZone",
        "acm:RequestCertificate",
        "acm:DescribeCertificate"
      ],
      "Resource": "*"
    }
  ]
}
```

## Monitoring & Troubleshooting

### Certificate Monitoring
```
Certificate Health Checks:
├── Expiry monitoring (CloudWatch alarms)
├── Validation status tracking
├── Renewal failure alerts
└── Certificate transparency logs
```

### DNS Monitoring
```
DNS Health Monitoring:
├── Query response times
├── Resolution success rates
├── Geographic performance
└── Availability monitoring
```

### Common Issues

#### Certificate Validation Stuck
**Problem**: Certificate remains in "Pending validation" status
**Causes:**
- Incorrect name servers at domain registrar
- DNS propagation delays
- Hosted zone configuration errors

**Solutions:**
```bash
# Check DNS propagation
dig _abc123.example.com CNAME
nslookup _abc123.example.com

# Verify name servers
dig example.com NS
```

#### Domain Not Resolving
**Problem**: Website not accessible via custom domain
**Causes:**
- Name servers not updated at registrar
- DNS records not created properly
- CloudFront distribution not ready

**Solutions:**
```bash
# Check name servers
dig example.com NS

# Check A records
dig example.com A
dig example.com AAAA

# Test from multiple locations
https://www.whatsmydns.net/
```

#### SSL Certificate Errors
**Problem**: Browser shows certificate warnings
**Causes:**
- Certificate not associated with CloudFront
- Wrong domain name in certificate
- Certificate in wrong region

**Solutions:**
- Verify certificate ARN in CloudFront distribution
- Check certificate covers both example.com and www.example.com
- Ensure certificate is in us-east-1

### Debugging Commands
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/abc123

# Check hosted zone
aws route53 get-hosted-zone --id Z123456789

# List DNS records
aws route53 list-resource-record-sets --hosted-zone-id Z123456789

# Test DNS resolution
dig example.com @8.8.8.8
nslookup example.com 1.1.1.1
```

## Best Practices

### Certificate Management
```
✅ Use DNS validation for automation
✅ Include both apex and www domains
✅ Monitor certificate expiry
✅ Set up renewal failure alerts
✅ Use separate certificates per environment
```

### DNS Configuration
```
✅ Use alias records for AWS resources
✅ Implement both IPv4 and IPv6 support
✅ Set appropriate TTL values
✅ Monitor DNS query patterns
✅ Implement health checks for critical records
```

### Security Hardening
```
✅ Enable DNSSEC (if required)
✅ Use least privilege IAM policies
✅ Enable CloudTrail for DNS changes
✅ Regular security audits
✅ Incident response procedures
```

### Operational Excellence
```
✅ Infrastructure as code (CDK)
✅ Environment-specific configurations
✅ Automated certificate renewal
✅ Monitoring and alerting
✅ Documentation and runbooks
```

## Integration Examples

### Complete Frontend Stack
```typescript
// Deploy all three stacks with proper dependencies
const staticHostingStack = new StaticHostingStack(app, 'StaticHosting', {
  environmentConfig: prodConfig
})

const cdnStack = new CdnStack(app, 'CDN', {
  environmentConfig: prodConfig,
  originBucket: staticHostingStack.staticWebsite.bucket
})

const dnsStack = new DnsStack(app, 'DNS', {
  environmentConfig: prodConfig,
  distribution: cdnStack.cdnDistribution.distribution,
  env: { region: 'us-east-1' }  // Required for certificate
})
```

### Environment-Specific Deployment
```typescript
// Development environment (no custom domain)
const devCdnStack = new CdnStack(app, 'DevCDN', {
  environmentConfig: devConfig,
  originBucket: devStaticStack.staticWebsite.bucket
  // No certificate - uses CloudFront domain
})

// Production environment (with custom domain)
const prodDnsStack = new DnsStack(app, 'ProdDNS', {
  environmentConfig: prodConfig,
  distribution: prodCdnStack.cdnDistribution.distribution
})
```
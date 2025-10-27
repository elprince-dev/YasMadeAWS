# AWS Serverless Migration Plan - YasMade Frontend

## Overview
Migrate the React frontend from Netlify to AWS using serverless architecture with CloudFront, S3, ACM, and Route53.

## Phase 1: Frontend Infrastructure (Current Focus)

### 1. S3 Static Website Hosting
- **Purpose**: Host the built React application
- **Configuration**:
  - Create S3 bucket for static assets
  - Enable static website hosting
  - Configure index.html and error.html
  - Set up proper CORS policies
  - Block public access (CloudFront will serve content)

### 2. CloudFront Distribution
- **Purpose**: Global CDN for fast content delivery
- **Configuration**:
  - Origin: S3 bucket
  - Default root object: index.html
  - Error pages: redirect 404s to index.html (SPA routing)
  - Caching behaviors for different file types
  - Compression enabled
  - Security headers
  - Custom domain configuration

### 3. SSL Certificate (ACM)
- **Purpose**: HTTPS encryption for custom domain
- **Configuration**:
  - Request certificate in us-east-1 (required for CloudFront)
  - Domain validation via DNS
  - Include both apex domain and www subdomain
  - Auto-renewal enabled

### 4. Route53 Hosted Zone
- **Purpose**: DNS management for custom domain
- **Configuration**:
  - Create hosted zone for your domain
  - A record pointing to CloudFront distribution
  - AAAA record for IPv6 support
  - Optional: www subdomain redirect

### 5. Domain Migration from Namecheap
- **Steps**:
  1. Update nameservers in Namecheap to Route53 NS records
  2. Verify DNS propagation
  3. Test domain resolution

## Phase 2: Backend Infrastructure (Future)

### 1. API Gateway + Lambda
- **Purpose**: Serverless API endpoints
- **Services**:
  - Replace Supabase Edge Functions
  - Authentication endpoints
  - CRUD operations for products, blogs, sessions
  - File upload handling

### 2. Database Migration
- **Options**:
  - Keep Supabase (hybrid approach)
  - Migrate to RDS Aurora Serverless
  - Use DynamoDB for NoSQL approach

### 3. Authentication
- **Options**:
  - AWS Cognito
  - Keep Supabase Auth
  - Custom JWT implementation

### 4. File Storage
- **Purpose**: Replace Supabase Storage
- **Configuration**:
  - S3 bucket for user uploads
  - Separate from static website bucket
  - Presigned URLs for secure uploads
  - CloudFront distribution for image delivery

### 5. CI/CD Pipeline
- **Purpose**: Automated deployment
- **Components**:
  - CodePipeline
  - CodeBuild for React build
  - CodeDeploy for S3 sync
  - CloudFront cache invalidation

## Implementation Order

### Step 1: Foundation Setup
1. Create domain-driven folder structure
2. Set up shared configuration and constants
3. Define domain-specific TypeScript interfaces
4. Create base constructs and utilities

### Step 2: Frontend Domain (Phase 1)
1. Frontend domain constructs (SSL, S3, CloudFront, DNS)
2. Frontend domain stacks (hosting, CDN, DNS)
3. Frontend domain configuration and security
4. Frontend domain tests

### Step 3: API Domain (Phase 2 - Future)
1. API Gateway and Lambda constructs
2. API domain stacks and monitoring
3. Function deployment and versioning
4. API security and rate limiting

### Step 4: Database Domain (Phase 2 - Future)
1. Database constructs (RDS/DynamoDB)
2. Database stacks with backup policies
3. Migration and schema management
4. Database security and access patterns

### Step 5: Auth Domain (Phase 2 - Future)
1. Cognito constructs and configuration
2. Authentication stacks and triggers
3. OAuth integration and user management
4. Security policies and compliance

### Step 6: Storage Domain (Phase 2 - Future)
1. Media storage constructs
2. File processing and CDN
3. Upload policies and security
4. Image optimization pipeline

### Step 7: Pipeline Domain (Phase 3 - Future)
1. CI/CD pipeline constructs
2. Multi-environment deployment
3. Approval workflows and rollback
4. Monitoring and notifications

## CDK Project Structure (Domain-Driven Architecture)

```
src/
├── bin/
│   └── app.ts                   # CDK app entry point
├── domains/
│   ├── frontend/
│   │   ├── stacks/
│   │   │   ├── static-hosting-stack.ts    # S3 + CloudFront
│   │   │   ├── cdn-stack.ts               # CloudFront distribution
│   │   │   └── dns-stack.ts               # Route53 + ACM
│   │   ├── constructs/
│   │   │   ├── static-website.ts          # S3 bucket + policies
│   │   │   ├── cdn-distribution.ts        # CloudFront + behaviors
│   │   │   ├── ssl-certificate.ts         # ACM + validation
│   │   │   └── domain-setup.ts            # Route53 records
│   │   └── config/
│   │       ├── cdn-behaviors.ts           # Caching rules
│   │       └── security-headers.ts        # Response headers
│   ├── api/
│   │   ├── stacks/
│   │   │   ├── gateway-stack.ts           # API Gateway
│   │   │   ├── lambda-stack.ts            # Lambda functions
│   │   │   └── monitoring-stack.ts        # CloudWatch + X-Ray
│   │   ├── constructs/
│   │   │   ├── rest-api.ts                # API Gateway setup
│   │   │   ├── lambda-function.ts         # Lambda with layers
│   │   │   └── api-authorizer.ts          # Custom authorizers
│   │   └── functions/
│   │       ├── auth/                      # Auth-related lambdas
│   │       ├── products/                  # Product CRUD
│   │       ├── blogs/                     # Blog CRUD
│   │       └── sessions/                  # Session CRUD
│   ├── database/
│   │   ├── stacks/
│   │   │   ├── rds-stack.ts               # Aurora Serverless
│   │   │   ├── dynamodb-stack.ts          # DynamoDB tables
│   │   │   └── backup-stack.ts            # Backup policies
│   │   ├── constructs/
│   │   │   ├── aurora-cluster.ts          # RDS Aurora setup
│   │   │   ├── dynamodb-table.ts          # DDB with GSI
│   │   │   └── database-proxy.ts          # RDS Proxy
│   │   └── migrations/
│   │       └── schema/                    # Database schemas
│   ├── auth/
│   │   ├── stacks/
│   │   │   ├── cognito-stack.ts           # User pools
│   │   │   ├── identity-stack.ts          # Identity pools
│   │   │   └── oauth-stack.ts             # OAuth providers
│   │   ├── constructs/
│   │   │   ├── user-pool.ts               # Cognito user pool
│   │   │   ├── identity-provider.ts       # OAuth setup
│   │   │   └── auth-triggers.ts           # Lambda triggers
│   │   └── config/
│   │       ├── user-attributes.ts         # User schema
│   │       └── password-policy.ts         # Security policies
│   └── storage/
│       ├── stacks/
│       │   ├── media-stack.ts             # S3 for uploads
│       │   └── cdn-stack.ts               # CloudFront for media
│       └── constructs/
│           ├── upload-bucket.ts           # S3 with policies
│           └── media-processing.ts        # Lambda for processing
├── shared/
│   ├── config/
│   │   ├── environments/
│   │   │   ├── dev.ts                     # Dev environment
│   │   │   ├── staging.ts                 # Staging environment
│   │   │   └── prod.ts                    # Prod environment
│   │   ├── constants/
│   │   │   ├── aws.ts                     # AWS-specific constants
│   │   │   ├── application.ts             # App constants
│   │   │   └── security.ts                # Security settings
│   │   └── index.ts                       # Config exports
│   ├── types/
│   │   ├── environment.ts                 # Environment interfaces
│   │   ├── stack-props.ts                 # Stack properties
│   │   ├── domain-types.ts                # Domain-specific types
│   │   └── index.ts                       # Type exports
│   ├── utils/
│   │   ├── naming.ts                      # Resource naming
│   │   ├── tagging.ts                     # Resource tagging
│   │   ├── validation.ts                  # Input validation
│   │   └── stack-helpers.ts               # Common stack utils
│   └── constructs/
│       ├── base-stack.ts                  # Base stack class
│       ├── monitored-resource.ts          # CloudWatch integration
│       └── tagged-resource.ts             # Auto-tagging
├── pipeline/
│   ├── stacks/
│   │   ├── build-stack.ts                 # CodeBuild projects
│   │   ├── deploy-stack.ts                # CodePipeline
│   │   └── approval-stack.ts              # Manual approvals
│   └── constructs/
│       ├── build-project.ts               # CodeBuild setup
│       └── deployment-pipeline.ts         # Multi-stage pipeline
└── tests/
    ├── unit/
    │   ├── domains/                       # Domain-specific tests
    │   │   ├── frontend/
    │   │   ├── api/
    │   │   ├── database/
    │   │   └── auth/
    │   └── shared/                        # Shared utility tests
    ├── integration/
    │   ├── cross-domain/                  # Cross-domain tests
    │   └── end-to-end/                    # E2E deployment tests
    └── fixtures/
        └── test-data/                     # Test data and mocks
```

## Environment Configuration

### File Organization
- **config/environments/**: Environment-specific settings
- **config/constants.ts**: Global constants (regions, naming patterns)
- **types/**: TypeScript interfaces and types
- **lib/stacks/**: Individual stack definitions
- **lib/constructs/**: Reusable CDK constructs
- **lib/utils/**: Helper functions and utilities

### Development Environment
```typescript
// config/environments/dev.ts
export const devConfig = {
  domain: 'dev.yourdomain.com',
  certificateRegion: 'us-east-1',
  bucketName: 'yasmade-dev-static-website',
  environment: 'dev'
}
```

### Production Environment
```typescript
// config/environments/prod.ts
export const prodConfig = {
  domain: 'yourdomain.com',
  certificateRegion: 'us-east-1', 
  bucketName: 'yasmade-prod-static-website',
  environment: 'prod'
}
```

### Constants Structure
```typescript
// config/constants.ts
export const AWS_REGIONS = {
  PRIMARY: 'us-east-1',
  CERTIFICATE: 'us-east-1' // Required for CloudFront
} as const

export const RESOURCE_NAMES = {
  PREFIX: 'yasmade',
  SEPARATOR: '-'
} as const

export const CLOUDFRONT_SETTINGS = {
  PRICE_CLASS: 'PriceClass_100',
  DEFAULT_TTL: 86400,
  MAX_TTL: 31536000
} as const
```

## Cost Estimation (Monthly)
- S3: ~$1-5 (depending on storage and requests)
- CloudFront: ~$1-10 (depending on traffic)
- Route53: ~$0.50 per hosted zone
- ACM: Free
- **Total**: ~$2.50-15.50/month

## Migration Checklist

### Pre-Migration
- [ ] Backup current Netlify deployment
- [ ] Document current environment variables
- [ ] Test build process locally
- [ ] Prepare domain transfer plan

### Migration Day
- [ ] Deploy CDK stack
- [ ] Upload built assets to S3
- [ ] Configure CloudFront
- [ ] Update nameservers
- [ ] Test all functionality
- [ ] Monitor for issues

### Post-Migration
- [ ] Update CI/CD to deploy to AWS
- [ ] Remove Netlify deployment
- [ ] Monitor performance and costs
- [ ] Plan Phase 2 backend migration

## File Creation Order

### Phase 1: Setup Foundation
1. **config/constants.ts** - Global constants
2. **types/environment.ts** - Type definitions
3. **config/environments/** - Environment configs
4. **lib/utils/naming.ts** - Resource naming helpers

### Phase 2: Shared Infrastructure
5. **shared/config/constants/** - AWS and app constants
6. **shared/utils/naming.ts** - Resource naming conventions
7. **shared/constructs/base-stack.ts** - Base stack with common features
8. **shared/utils/tagging.ts** - Consistent resource tagging

### Phase 3: Domain Implementation (Frontend First)
9. **domains/frontend/constructs/ssl-certificate.ts** - Certificate management
10. **domains/frontend/constructs/static-website.ts** - S3 hosting setup
11. **domains/frontend/constructs/cdn-distribution.ts** - CloudFront configuration
12. **domains/frontend/constructs/domain-setup.ts** - Route53 DNS

### Phase 4: Frontend Stacks
13. **domains/frontend/stacks/static-hosting-stack.ts** - S3 + policies
14. **domains/frontend/stacks/cdn-stack.ts** - CloudFront + behaviors
15. **domains/frontend/stacks/dns-stack.ts** - Route53 + ACM

### Phase 5: Integration
16. **bin/app.ts** - Main CDK app with domain orchestration
17. **tests/unit/domains/frontend/** - Frontend domain tests
18. **tests/integration/cross-domain/** - Integration tests

## Benefits of Domain-Driven Architecture

### Senior-Level Design Principles
- **Domain Separation**: Frontend, API, Database, Auth as separate domains
- **Bounded Contexts**: Each domain owns its infrastructure and business logic
- **Dependency Inversion**: Domains depend on shared abstractions, not implementations
- **Single Responsibility**: Each construct/stack has one clear purpose
- **Open/Closed Principle**: Easy to extend domains without modifying existing code

### Operational Benefits
- **Team Ownership**: Different teams can own different domains
- **Independent Deployment**: Domains can be deployed separately
- **Scalability**: Easy to scale individual domains based on needs
- **Testing Isolation**: Domain-specific tests with clear boundaries
- **Security Boundaries**: Each domain has its own security policies
- **Monitoring**: Domain-specific metrics and alarms

### Development Benefits
- **Code Reusability**: Shared constructs across domains
- **Type Safety**: Strong typing with domain-specific interfaces
- **Environment Parity**: Consistent structure across dev/staging/prod
- **Documentation**: Self-documenting structure through organization
- **Onboarding**: New developers can focus on specific domains

## Next Steps
1. Review and approve this plan
2. Set up AWS account and CDK environment
3. Create the organized file structure
4. Begin implementation with Phase 1 foundation files
5. Test thoroughly before domain migration
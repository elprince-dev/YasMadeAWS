# Requirements Document

## Introduction

YasMade is a handmade embroidery e-commerce and creative workshop platform. The site currently runs its frontend on Netlify, uses Supabase for backend (database, auth, storage), and relies on Resend (via Supabase Edge Functions) for newsletter emails and EmailJS for contact form notifications. Stripe payment code exists but is no longer used.

This feature migrates the frontend hosting to AWS (S3 + CloudFront + Route53 + ACM), replaces all email sending with AWS SES via an API Gateway + Lambda email API, and removes dead Stripe and Resend/EmailJS code.

## Glossary

- **Static_Hosting**: The S3 bucket and associated configuration that stores and serves the built React application assets
- **CDN**: The CloudFront distribution that provides global content delivery, caching, and HTTPS termination for the static website
- **DNS_System**: The Route53 hosted zone and DNS records that map the `yasmade.net` domain to the CloudFront distribution
- **SSL_Certificate**: The ACM certificate that provides HTTPS encryption for the custom domain
- **Email_API**: The API Gateway + Lambda function that provides a server-side HTTP endpoint for sending emails via SES
- **SES_Service**: The AWS Simple Email Service configured with the `yasmade.net` domain for sending transactional and newsletter emails
- **Newsletter_Sender**: The component of the Email_API responsible for sending bulk newsletter emails to subscribers
- **Contact_Notifier**: The component of the Email_API responsible for forwarding contact form submissions to the site admin
- **Order_Notifier**: The component of the Email_API responsible for sending order confirmation emails to customers
- **Admin_Panel**: The existing protected admin interface used by the site owner to manage content, subscribers, and send newsletters
- **CDK_Infrastructure**: The AWS CDK TypeScript project in `packages/cdk` that defines all AWS resources as infrastructure-as-code

## Requirements

### Requirement 1: Static Website Hosting on S3

**User Story:** As a site owner, I want my React frontend hosted on an S3 bucket, so that I can serve the website reliably from AWS infrastructure.

#### Acceptance Criteria

1. THE Static_Hosting SHALL store the built React application assets in an S3 bucket with public access blocked
2. THE Static_Hosting SHALL enable versioning on the S3 bucket for rollback capability
3. WHEN the CDN requests content, THE Static_Hosting SHALL serve assets via an Origin Access Identity
4. THE CDK_Infrastructure SHALL define the S3 bucket as a CDK construct in the `packages/cdk` project

### Requirement 2: CloudFront CDN Distribution

**User Story:** As a site visitor, I want the website delivered through a global CDN, so that pages load quickly regardless of my location.

#### Acceptance Criteria

1. THE CDN SHALL distribute content from the Static_Hosting S3 bucket as its origin
2. THE CDN SHALL serve the `index.html` file as the default root object
3. WHEN a 404 or 403 error occurs, THE CDN SHALL return `index.html` with a 200 status code to support SPA client-side routing
4. THE CDN SHALL compress responses using gzip and Brotli for text-based assets
5. THE CDN SHALL apply security headers including X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, and Content-Security-Policy
6. THE CDN SHALL use the PriceClass_100 price class covering US, Canada, and Europe edge locations
7. THE CDK_Infrastructure SHALL define the CloudFront distribution as a CDK construct in the `packages/cdk` project

### Requirement 3: SSL Certificate and Custom Domain

**User Story:** As a site owner, I want my website accessible via `yasmade.net` with HTTPS, so that visitors have a secure and branded experience.

#### Acceptance Criteria

1. THE SSL_Certificate SHALL be provisioned in the `us-east-1` region via ACM with DNS validation
2. THE SSL_Certificate SHALL cover both `yasmade.net` and `www.yasmade.net`
3. THE DNS_System SHALL create a Route53 hosted zone for `yasmade.net`
4. THE DNS_System SHALL create A and AAAA alias records pointing to the CDN distribution
5. WHEN a visitor accesses `www.yasmade.net`, THE DNS_System SHALL redirect to `yasmade.net`
6. THE CDK_Infrastructure SHALL define the SSL certificate and DNS records as CDK constructs

### Requirement 4: SES Domain Verification and Configuration

**User Story:** As a site owner, I want AWS SES configured with my domain, so that I can send emails from `yasmade.net` addresses with proper deliverability.

#### Acceptance Criteria

1. THE SES_Service SHALL verify the `yasmade.net` domain for email sending
2. THE SES_Service SHALL configure DKIM authentication records in the DNS_System
3. THE SES_Service SHALL configure a MAIL FROM subdomain for SPF alignment
4. THE CDK_Infrastructure SHALL define SES domain identity and DNS verification records as CDK constructs
5. IF SES is in sandbox mode, THEN THE CDK_Infrastructure SHALL document the steps to request production access

### Requirement 5: Email API via API Gateway and Lambda

**User Story:** As a site owner, I want a server-side email API, so that email credentials remain secure and email sending is validated before dispatch.

#### Acceptance Criteria

1. THE Email_API SHALL expose HTTP endpoints via API Gateway for sending emails
2. THE Email_API SHALL implement a Lambda function that sends emails through the SES_Service
3. WHEN a request is received, THE Email_API SHALL validate the request body for required fields (recipients, subject, content)
4. WHEN a request has invalid or missing fields, THE Email_API SHALL return a 400 error with a descriptive message
5. THE Email_API SHALL accept an authorization header and validate it against the Supabase JWT to authenticate admin requests
6. WHEN an unauthenticated request is received for admin-only endpoints, THE Email_API SHALL return a 401 error
7. THE Email_API SHALL configure CORS headers to allow requests from the frontend domain
8. THE CDK_Infrastructure SHALL define the API Gateway and Lambda function as CDK constructs
9. THE CDK_Infrastructure SHALL grant the Lambda function permission to send emails via SES

### Requirement 6: Newsletter Email Sending

**User Story:** As a site admin, I want to send newsletter emails to all subscribers through the Admin_Panel using SES, so that I can communicate with my audience without relying on third-party email services.

#### Acceptance Criteria

1. WHEN the admin composes and sends a newsletter, THE Newsletter_Sender SHALL send the email to all provided subscriber addresses via SES
2. THE Newsletter_Sender SHALL render the email using an HTML template that includes the YasMade logo, formatted content, signature, and footer
3. THE Newsletter_Sender SHALL generate a plain text version of the email by stripping HTML tags
4. WHEN the newsletter content contains images, THE Newsletter_Sender SHALL process image URLs to ensure they are absolute URLs
5. IF sending to a subscriber fails, THEN THE Newsletter_Sender SHALL continue sending to remaining subscribers and report failures

### Requirement 7: Contact Form Email Notification

**User Story:** As a site owner, I want contact form submissions forwarded to my email via SES, so that I receive customer inquiries without exposing email service credentials in the frontend.

#### Acceptance Criteria

1. WHEN a visitor submits the contact form, THE Contact_Notifier SHALL send a notification email to the admin email address via SES
2. THE Contact_Notifier SHALL include the sender name, email, subject, and message in the notification email
3. THE Contact_Notifier SHALL set the reply-to header to the visitor's email address
4. THE Contact_Notifier SHALL accept requests without admin authentication since it is a public-facing endpoint
5. THE Contact_Notifier SHALL implement rate limiting to prevent abuse of the public endpoint

### Requirement 8: Order Confirmation Email

**User Story:** As a customer, I want to receive an order confirmation email after placing an order, so that I have a record of my purchase details.

#### Acceptance Criteria

1. WHEN an order is placed, THE Order_Notifier SHALL send a confirmation email to the customer's email address via SES
2. THE Order_Notifier SHALL include order details: order ID, items with quantities and prices, shipping information, discount applied, and total amount
3. THE Order_Notifier SHALL include payment instructions for e-transfer with the payment proof upload link
4. THE Order_Notifier SHALL send a copy of the order notification to the admin email address

### Requirement 9: Frontend Integration with Email API

**User Story:** As a developer, I want the frontend updated to call the new Email API instead of EmailJS and Resend, so that all email sending goes through the secure server-side API.

#### Acceptance Criteria

1. WHEN the admin sends a newsletter from the Admin_Panel, THE Admin_Panel SHALL call the Email_API newsletter endpoint instead of the Supabase Edge Function
2. WHEN a visitor submits the contact form, THE frontend SHALL call the Email_API contact endpoint instead of EmailJS
3. WHEN an order is placed, THE frontend SHALL call the Email_API order confirmation endpoint
4. THE frontend SHALL remove the `@emailjs/browser` dependency and all EmailJS-related code
5. THE frontend SHALL remove the `resend` dependency
6. THE frontend SHALL store the Email_API base URL in an environment variable

### Requirement 10: Stripe Code Removal

**User Story:** As a developer, I want all unused Stripe code removed, so that the codebase is clean and free of dead dependencies.

#### Acceptance Criteria

1. THE frontend SHALL remove the `@stripe/stripe-js` and `stripe` npm dependencies
2. THE frontend SHALL remove the Supabase Edge Functions `stripe-product` and `create-checkout-session`
3. THE frontend SHALL remove any Stripe-related imports or references in frontend source files

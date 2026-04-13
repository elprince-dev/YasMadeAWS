# Implementation Plan: SES Email Integration & AWS Hosting

## Overview

Build on the existing CDK scaffolding to wire up frontend hosting stacks, add SES email infrastructure with API Gateway + Lambda, update the frontend to use the new Email API, and remove dead Stripe/Resend/EmailJS code. Tasks are ordered so each builds on the previous, with testing integrated alongside implementation.

## Tasks

- [x] 1. Refactor CDK stack structure and wire app entry point
  - [x] 1.1 Create CertificateStack that creates the Route53 hosted zone and ACM certificate (refactored from DnsStack to break circular dependency)
    - Reuse existing `SslCertificate` and `DomainSetup` constructs (split hosted zone creation from DNS record creation)
    - Certificate must be in us-east-1 for CloudFront
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 1.2 Refactor DnsStack to only create DNS records (A, AAAA, www) pointing to CloudFront distribution
    - Accept hosted zone and distribution as props (no longer creates hosted zone)
    - _Requirements: 3.4, 3.5_
  - [x] 1.3 Update `packages/cdk/src/bin/app.ts` to instantiate all stacks in order: StaticHostingStack → CertificateStack → CdnStack → DnsStack
    - Pass cross-stack references (S3 bucket, certificate, distribution, hosted zone)
    - Use dev environment config
    - _Requirements: 1.4, 2.7, 3.6_
  - [x] 1.4 Write CDK snapshot tests for StaticHostingStack, CertificateStack, CdnStack, and DnsStack
    - Verify key resource properties: S3 block public access, CloudFront error responses, certificate SANs, DNS records
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 2. Checkpoint - Ensure CDK synth succeeds and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create SES domain identity construct
  - [x] 3.1 Create `packages/cdk/src/domains/email/constructs/ses-identity.ts`
    - Create EmailIdentity for yasmade.net domain with DKIM
    - Configure MAIL FROM subdomain (mail.yasmade.net) for SPF alignment
    - Add required DNS records to the Route53 hosted zone
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 3.2 Write CDK assertion test for SES identity construct
    - Verify EmailIdentity resource, DKIM records, and MAIL FROM configuration in synthesized template
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Create Lambda email handler
  - [x] 4.1 Create `packages/cdk/src/domains/email/lambda/email-handler.ts` with route-based dispatch
    - Implement request validation for all three endpoint types (newsletter, contact, order-confirmation)
    - Implement JWT validation for admin endpoints using Supabase JWT verification
    - Implement SES email sending using AWS SDK v3
    - _Requirements: 5.2, 5.3, 5.5_
  - [x] 4.2 Implement newsletter email template rendering and sending logic
    - HTML template with logo, content, signature, footer
    - Plain text generation by stripping HTML tags
    - Image URL absolutization for relative URLs
    - Bulk sending to subscriber list with failure collection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 4.3 Implement contact form notification logic
    - Format notification email with sender details
    - Set reply-to header to visitor's email
    - Send to admin email address
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 4.4 Implement order confirmation email logic
    - Format order summary with items, totals, shipping, discount
    - Include e-transfer payment instructions and proof upload link
    - Send to both customer and admin
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 4.5 Write property test: Request validation rejects incomplete payloads (Property 1)
    - **Property 1: Request validation rejects incomplete payloads**
    - **Validates: Requirements 5.3, 5.4**
  - [x] 4.6 Write property test: JWT authentication gates admin endpoints (Property 2)
    - **Property 2: JWT authentication gates admin endpoints**
    - **Validates: Requirements 5.5, 5.6**
  - [x] 4.7 Write property test: Newsletter sends to all subscribers (Property 3)
    - **Property 3: Newsletter sends to all subscribers**
    - **Validates: Requirements 6.1**
  - [x] 4.8 Write property test: Newsletter HTML template contains required elements (Property 4)
    - **Property 4: Newsletter HTML template contains required elements**
    - **Validates: Requirements 6.2**
  - [x] 4.9 Write property test: Plain text generation strips all HTML (Property 5)
    - **Property 5: Plain text generation strips all HTML**
    - **Validates: Requirements 6.3**
  - [x] 4.10 Write property test: Image URL absolutization (Property 6)
    - **Property 6: Image URL absolutization**
    - **Validates: Requirements 6.4**
  - [x] 4.11 Write property test: Contact notification email correctness (Property 7)
    - **Property 7: Contact notification email correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  - [x] 4.12 Write property test: Order confirmation email completeness (Property 8)
    - **Property 8: Order confirmation email completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 5. Checkpoint - Ensure all Lambda handler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create Email API construct and Email Stack
  - [x] 6.1 Create `packages/cdk/src/domains/email/constructs/email-api.ts`
    - Create Lambda function with Node.js 20.x runtime bundled with the email handler
    - Grant Lambda ses:SendEmail and ses:SendRawEmail permissions
    - Create HTTP API (API Gateway v2) with CORS for frontend domain
    - Add routes: POST /newsletter, POST /contact, POST /order-confirmation
    - Configure rate limiting on /contact route (10 req/s, burst 20)
    - Pass environment variables: ADMIN_EMAIL, DOMAIN_NAME, SUPABASE_URL, SUPABASE_ANON_KEY
    - _Requirements: 5.1, 5.7, 5.8, 5.9, 7.4, 7.5_
  - [x] 6.2 Create `packages/cdk/src/domains/email/stacks/email-stack.ts`
    - Compose SES identity and Email API constructs
    - Accept hosted zone from CertificateStack as prop
    - _Requirements: 5.8_
  - [x] 6.3 Update `packages/cdk/src/bin/app.ts` to add EmailStack after DnsStack
    - Pass hosted zone reference to EmailStack
    - _Requirements: 5.8_
  - [x] 6.4 Write CDK assertion tests for EmailStack
    - Verify Lambda function, API Gateway routes, SES permissions, CORS config
    - _Requirements: 5.1, 5.7, 5.9_

- [x] 7. Checkpoint - Ensure CDK synth succeeds with all stacks and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update frontend to use Email API
  - [x] 8.1 Add `VITE_EMAIL_API_URL` to `.env.example` and create an email API utility module
    - Create `packages/frontend/src/utils/emailApi.js` with functions: sendNewsletter, sendContactNotification, sendOrderConfirmation
    - _Requirements: 9.6_
  - [x] 8.2 Update `AdminSubscribers.jsx` to call Email API for newsletter sending
    - Replace Supabase Edge Function fetch with emailApi.sendNewsletter()
    - Keep same UX (loading state, error handling, success message)
    - _Requirements: 9.1_
  - [x] 8.3 Update `ContactPage.jsx` to call Email API for contact notifications
    - Remove EmailJS import and sendForm call
    - Add emailApi.sendContactNotification() after Supabase insert
    - Remove hardcoded EmailJS credentials
    - _Requirements: 9.2_
  - [x] 8.4 Update `CartPage.jsx` or `OrderConfirmationPage.jsx` to call Email API for order confirmation
    - Add emailApi.sendOrderConfirmation() after order creation
    - _Requirements: 9.3_

- [x] 9. Remove dead code and dependencies
  - [x] 9.1 Remove Stripe dependencies and edge functions
    - Remove `@stripe/stripe-js` and `stripe` from `packages/frontend/package.json`
    - Delete `packages/frontend/supabase/functions/stripe-product/`
    - Delete `packages/frontend/supabase/functions/create-checkout-session/`
    - Remove any Stripe imports in frontend source files
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 9.2 Remove EmailJS and Resend dependencies
    - Remove `@emailjs/browser` and `resend` from `packages/frontend/package.json`
    - _Requirements: 9.4, 9.5_

- [x] 10. Update environment configuration
  - [x] 10.1 Add production environment config to CDK
    - Create `packages/cdk/src/shared/config/environments/prod.ts` with `yasmade.net` domain
    - Update dev config if needed
    - _Requirements: 3.1, 4.1_
  - [x] 10.2 Update `packages/frontend/.env.example` with all required environment variables
    - Add VITE_EMAIL_API_URL
    - Document Supabase variables
    - _Requirements: 9.6_

- [x] 11. Final checkpoint - Ensure all tests pass and CDK synth succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required including tests for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The domain registration stays at Namecheap; only nameservers need to be updated to Route53 after deployment

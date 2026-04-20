# Security Headers Configuration - Theory & Concepts

## Table of Contents

1. [Web Security Headers Fundamentals](#web-security-headers-fundamentals)
2. [Security Header Types](#security-header-types)
3. [Content Security Policy (CSP)](#content-security-policy-csp)
4. [Security Levels Explained](#security-levels-explained)
5. [React App Considerations](#react-app-considerations)
6. [Environment-Specific Headers](#environment-specific-headers)
7. [Security Best Practices](#security-best-practices)

## Web Security Headers Fundamentals

### What are Security Headers?

- **HTTP response headers** - Sent by server to browser with every response
- **Browser instructions** - Tell browser how to handle content securely
- **Defense in depth** - Multiple layers of security protection
- **Standards compliance** - Meet security requirements and best practices

### How Security Headers Work

```
1. User requests: https://example.com/
2. CloudFront adds security headers to response
3. Browser receives headers and enforces policies
4. Malicious attacks blocked by browser security features
```

### Common Attack Vectors

| Attack Type       | Description                  | Prevention Header           |
| ----------------- | ---------------------------- | --------------------------- |
| **Clickjacking**  | Invisible iframe overlay     | `X-Frame-Options`           |
| **XSS**           | Malicious script injection   | `X-XSS-Protection`, `CSP`   |
| **MIME Sniffing** | Browser guesses content type | `X-Content-Type-Options`    |
| **Man-in-Middle** | HTTP interception            | `Strict-Transport-Security` |
| **Data Leakage**  | Referrer information leak    | `Referrer-Policy`           |

## Security Header Types

### X-Frame-Options

```typescript
frameOptions: {
  frameOption: HeadersFrameOption.DENY,
  override: false
}
```

**Purpose:** Prevents clickjacking attacks
**Values:**

- `DENY` - Never allow embedding in frames
- `SAMEORIGIN` - Allow embedding only from same domain
- `ALLOW-FROM uri` - Allow embedding from specific domain

**Clickjacking Attack Example:**

```html
<!-- Malicious site -->
<iframe src="https://yourbank.com/transfer" style="opacity:0">
  <!-- Invisible overlay tricks user into clicking --></iframe
>
```

**Protection:** Browser blocks iframe embedding entirely

### X-Content-Type-Options

```typescript
contentTypeOptions: {
  override: false;
}
```

**Purpose:** Prevents MIME type sniffing attacks
**Value:** Always `nosniff`
**Attack scenario:** Browser interprets image as JavaScript and executes it
**Protection:** Browser only interprets files as declared Content-Type

### X-XSS-Protection

```typescript
xssProtection: {
  modeBlock: true,
  protection: true,
  override: false
}
```

**Purpose:** Enables browser's built-in XSS filter
**Values:**

- `1; mode=block` - Enable XSS filter and block page if attack detected
- `1` - Enable XSS filter and sanitize page
- `0` - Disable XSS filter

**Note:** Modern browsers prefer CSP over X-XSS-Protection

### Strict-Transport-Security (HSTS)

```typescript
strictTransportSecurity: {
  accessControlMaxAge: Duration.seconds(31536000), // 1 year
  includeSubdomains: true,
  preload: false,
  override: false
}
```

**Purpose:** Forces HTTPS connections
**Parameters:**

- `max-age` - How long browser remembers HTTPS requirement
- `includeSubDomains` - Apply to all subdomains
- `preload` - Submit to browser preload lists

**Protection Flow:**

1. First visit: Browser receives HSTS header
2. Subsequent visits: Browser automatically uses HTTPS
3. Man-in-middle attacks blocked by forced encryption

### Referrer-Policy

```typescript
referrerPolicy: {
  referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
  override: false
}
```

**Purpose:** Controls referrer information sent to other sites
**Values:**

- `no-referrer` - Never send referrer
- `strict-origin` - Send origin only for HTTPS→HTTPS
- `strict-origin-when-cross-origin` - Full URL for same-origin, origin only for cross-origin

**Privacy protection:** Prevents leaking sensitive URLs to third parties

## Content Security Policy (CSP)

### What is CSP?

```typescript
contentSecurityPolicy: {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
  override: false
}
```

- **Whitelist approach** - Define allowed sources for each content type
- **XSS prevention** - Blocks unauthorized script execution
- **Data injection protection** - Prevents malicious content injection
- **Granular control** - Different policies for scripts, styles, images, etc.

### CSP Directives

| Directive     | Purpose                        | Example                  |
| ------------- | ------------------------------ | ------------------------ |
| `default-src` | Default policy for all content | `'self'`                 |
| `script-src`  | JavaScript sources             | `'self' 'unsafe-inline'` |
| `style-src`   | CSS sources                    | `'self' 'unsafe-inline'` |
| `img-src`     | Image sources                  | `'self' data: https:`    |
| `font-src`    | Font sources                   | `'self' https:`          |
| `connect-src` | AJAX/WebSocket sources         | `'self' https:`          |

### CSP Source Values

| Value             | Meaning                     | Use Case                  |
| ----------------- | --------------------------- | ------------------------- |
| `'self'`          | Same origin only            | Most secure default       |
| `'unsafe-inline'` | Allow inline scripts/styles | React apps (with caution) |
| `'unsafe-eval'`   | Allow eval() function       | Avoid if possible         |
| `data:`           | Data URLs                   | Base64 encoded images     |
| `https:`          | Any HTTPS source            | External resources        |
| `'none'`          | Block everything            | Maximum security          |

### React App CSP Challenges

```typescript
// React needs inline scripts and styles
"script-src 'self' 'unsafe-inline'", // React inline scripts
"style-src 'self' 'unsafe-inline'",  // CSS-in-JS libraries
```

**Why React needs 'unsafe-inline':**

- **Webpack runtime** - Injects inline scripts for module loading
- **CSS-in-JS** - Libraries like styled-components use inline styles
- **Hot reloading** - Development server injects inline scripts

**Safer alternatives:**

- Use nonce-based CSP for production
- Extract inline styles to external files
- Use CSP hash values for specific inline content

## Security Levels Explained

### STANDARD Level

```typescript
SecurityHeaders.STANDARD;
```

**Use case:** Most websites and applications
**Features:**

- Basic security headers
- No CSP (avoids compatibility issues)
- Balanced security without breaking functionality
- Good starting point for security implementation

**Headers included:**

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: 1 year
- Referrer-Policy: strict-origin-when-cross-origin

### ENHANCED Level

```typescript
SecurityHeaders.ENHANCED;
```

**Use case:** Security-conscious applications
**Features:**

- All standard headers plus CSP
- React-compatible CSP policy
- HSTS preload enabled
- Stronger security with minimal compatibility issues

**Additional features:**

- Content Security Policy for XSS protection
- HSTS preload list submission
- Longer HSTS duration (2 years)

### STRICT Level

```typescript
SecurityHeaders.STRICT;
```

**Use case:** High-security applications (banking, healthcare)
**Features:**

- Maximum security settings
- Very restrictive CSP
- Override existing headers
- May break some functionality

**Restrictions:**

- No inline scripts or styles allowed
- No external resources except same-origin
- No form submissions
- No iframe embedding under any circumstances

**Trade-offs:**

- ✅ Maximum security protection
- ❌ May break React apps without modification
- ❌ Requires careful testing and CSP tuning

## React App Considerations

### Common React CSP Issues

```typescript
// This CSP will break most React apps
"script-src 'self'"; // ❌ Blocks Webpack inline scripts

// React-compatible CSP
"script-src 'self' 'unsafe-inline'"; // ✅ Allows React to work
```

### Webpack and Build Tools

```javascript
// Webpack injects inline scripts like:
<script>
  window.__webpack_require__ = function(moduleId) { ... }
</script>
```

**Solutions:**

1. **Allow 'unsafe-inline'** - Easiest but less secure
2. **Use nonce-based CSP** - Generate unique nonce for each request
3. **Extract inline scripts** - Configure Webpack to avoid inline scripts

### CSS-in-JS Libraries

```javascript
// styled-components generates inline styles
const Button = styled.button`
  background: blue; // Becomes inline style
`;
```

**CSP impact:** Requires `'unsafe-inline'` in `style-src`
**Alternatives:**

- Use external CSS files
- Configure CSS-in-JS to use external stylesheets
- Use CSP nonces for inline styles

### Development vs Production

```typescript
// Development - more permissive
"script-src 'self' 'unsafe-inline' 'unsafe-eval'"; // Hot reloading needs eval

// Production - more restrictive
"script-src 'self' 'unsafe-inline'"; // Remove unsafe-eval
```

## Environment-Specific Headers

### Development Headers

```typescript
CustomHeaders.DEVELOPMENT = {
  'X-Environment': 'development',
  'X-Debug-Mode': 'enabled',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};
```

**Purpose:**

- **Debugging information** - Identify environment in browser tools
- **Disable caching** - Always get fresh content during development
- **Development tools** - Enable debugging features

### Production Headers

```typescript
CustomHeaders.PRODUCTION = {
  'X-Environment': 'production',
  'X-Content-Type-Options': 'nosniff',
  'X-Powered-By': 'AWS CloudFront',
};
```

**Purpose:**

- **Security hardening** - Additional security headers
- **Performance optimization** - Enable caching
- **Branding** - Identify technology stack (optional)

### Environment Detection

```typescript
const headers =
  process.env.NODE_ENV === 'production'
    ? CustomHeaders.PRODUCTION
    : CustomHeaders.DEVELOPMENT;
```

## Security Best Practices

### Header Implementation Strategy

```
1. Start with STANDARD level
2. Test thoroughly in development
3. Gradually increase to ENHANCED
4. Monitor for broken functionality
5. Consider STRICT for high-security needs
```

### CSP Implementation Process

```
1. Start with report-only mode
   Content-Security-Policy-Report-Only: ...

2. Monitor violation reports

3. Adjust policy based on violations

4. Switch to enforcement mode
   Content-Security-Policy: ...
```

### Testing Security Headers

```bash
# Check headers with curl
curl -I https://example.com

# Online security scanners
https://securityheaders.com/
https://observatory.mozilla.org/
```

### Monitoring and Alerting

```typescript
// CloudWatch alarms for CSP violations
new Alarm(this, 'CSPViolations', {
  metric: new Metric({
    namespace: 'AWS/CloudFront',
    metricName: 'CSPViolations',
  }),
  threshold: 100,
  evaluationPeriods: 2,
});
```

## Common Issues & Solutions

### CSP Blocking React App

**Problem:** White screen, console shows CSP violations
**Cause:** Too restrictive CSP policy
**Solution:** Add 'unsafe-inline' to script-src and style-src

### HSTS Not Working

**Problem:** Browser still allows HTTP connections
**Cause:** HSTS only applies after first HTTPS visit
**Solution:** Use HSTS preload list or redirect HTTP to HTTPS

### Mixed Content Warnings

**Problem:** HTTPS site loading HTTP resources
**Cause:** Hardcoded HTTP URLs in code
**Solution:** Use protocol-relative URLs or HTTPS only

### Headers Not Applied

**Problem:** Security headers missing from responses
**Cause:** CloudFront not configured to add headers
**Solution:** Verify ResponseHeadersPolicy is attached to distribution

## Advanced Security Configurations

### Nonce-based CSP

```typescript
// Generate unique nonce for each request
const nonce = generateNonce();

contentSecurityPolicy: `
  script-src 'self' 'nonce-${nonce}';
  style-src 'self' 'nonce-${nonce}';
`;
```

### Hash-based CSP

```typescript
// Allow specific inline scripts by hash
contentSecurityPolicy: `
  script-src 'self' 'sha256-abc123...';
  style-src 'self' 'sha256-def456...';
`;
```

### Feature Policy / Permissions Policy

```typescript
// Control browser features
customHeaders: {
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

## Compliance and Standards

### OWASP Recommendations

- ✅ Use HTTPS everywhere (HSTS)
- ✅ Prevent clickjacking (X-Frame-Options)
- ✅ Block MIME sniffing (X-Content-Type-Options)
- ✅ Implement CSP for XSS protection
- ✅ Control referrer information

### Industry Standards

- **PCI DSS** - Payment card industry security
- **HIPAA** - Healthcare data protection
- **GDPR** - European privacy regulation
- **SOC 2** - Security and availability controls

### Security Auditing

```bash
# Automated security testing
npm install -g observatory-cli
observatory example.com

# Manual testing
curl -I https://example.com | grep -i security
```

## Implementation Example

### Using in CDK Construct

```typescript
import {
  SecurityHeaders,
  createSecurityHeadersPolicy,
} from './security-headers';

// Create response headers policy
const securityPolicy = new ResponseHeadersPolicy(
  this,
  'SecurityPolicy',
  createSecurityHeadersPolicy('ENHANCED', CustomHeaders.PRODUCTION)
);

// Apply to CloudFront distribution
new Distribution(this, 'Distribution', {
  defaultBehavior: {
    responseHeadersPolicy: securityPolicy,
  },
});
```

### Custom Security Configuration

```typescript
// Create custom security level
const customSecurity = {
  ...SecurityHeaders.STANDARD,
  securityHeadersBehavior: {
    ...SecurityHeaders.STANDARD.securityHeadersBehavior,
    contentSecurityPolicy: {
      contentSecurityPolicy:
        "default-src 'self'; script-src 'self' https://trusted-cdn.com",
      override: false,
    },
  },
};
```

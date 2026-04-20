import { Duration } from 'aws-cdk-lib';
import {
  HeadersFrameOption,
  HeadersReferrerPolicy,
} from 'aws-cdk-lib/aws-cloudfront';

/**
 * Security headers configuration for CloudFront responses
 * Implements web security best practices and compliance requirements
 */
export const SecurityHeaders = {
  /**
   * Standard security headers for static websites
   * Provides good security without breaking functionality
   */
  STANDARD: {
    comment: 'Standard security headers for static websites',
    securityHeadersBehavior: {
      // Prevent clickjacking attacks
      frameOptions: {
        frameOption: HeadersFrameOption.DENY,
        override: false,
      },

      // Prevent MIME type sniffing
      contentTypeOptions: {
        override: false,
      },

      // Enable XSS protection in browsers
      xssProtection: {
        modeBlock: true,
        protection: true,
        override: false,
      },

      // Force HTTPS connections
      strictTransportSecurity: {
        accessControlMaxAge: Duration.seconds(31536000), // 1 year
        includeSubdomains: true,
        preload: false,
        override: false,
      },

      // Control referrer information
      referrerPolicy: {
        referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
        override: false,
      },
    },
  },

  /**
   * Enhanced security headers with Content Security Policy
   * More restrictive but may require CSP tuning for complex apps
   */
  ENHANCED: {
    comment: 'Enhanced security headers with CSP for static websites',
    securityHeadersBehavior: {
      frameOptions: {
        frameOption: HeadersFrameOption.DENY,
        override: false,
      },

      contentTypeOptions: {
        override: false,
      },

      xssProtection: {
        modeBlock: true,
        protection: true,
        override: false,
      },

      strictTransportSecurity: {
        accessControlMaxAge: Duration.seconds(63072000), // 2 years
        includeSubdomains: true,
        preload: true, // Submit to HSTS preload list
        override: false,
      },

      referrerPolicy: {
        referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
        override: false,
      },

      // Content Security Policy for React apps
      contentSecurityPolicy: {
        contentSecurityPolicy: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'", // React needs inline scripts
          "style-src 'self' 'unsafe-inline'", // CSS-in-JS needs inline styles
          "img-src 'self' data: https:", // Allow images from HTTPS and data URLs
          "font-src 'self' https:", // Allow fonts from HTTPS
          "connect-src 'self' https:", // Allow API calls to HTTPS
          "frame-ancestors 'none'", // Prevent embedding
          "base-uri 'self'", // Restrict base tag
          "form-action 'self'", // Restrict form submissions
        ].join('; '),
        override: false,
      },
    },
  },

  /**
   * Strict security headers for high-security applications
   * Maximum security but may break some functionality
   */
  STRICT: {
    comment: 'Strict security headers for high-security applications',
    securityHeadersBehavior: {
      frameOptions: {
        frameOption: HeadersFrameOption.DENY,
        override: true, // Override any existing headers
      },

      contentTypeOptions: {
        override: true,
      },

      xssProtection: {
        modeBlock: true,
        protection: true,
        override: true,
      },

      strictTransportSecurity: {
        accessControlMaxAge: Duration.seconds(63072000), // 2 years
        includeSubdomains: true,
        preload: true,
        override: true,
      },

      referrerPolicy: {
        referrerPolicy: HeadersReferrerPolicy.NO_REFERRER,
        override: true,
      },

      // Very strict CSP
      contentSecurityPolicy: {
        contentSecurityPolicy: [
          "default-src 'none'", // Block everything by default
          "script-src 'self'", // Only scripts from same origin
          "style-src 'self'", // Only styles from same origin
          "img-src 'self' data:", // Only images from same origin + data URLs
          "font-src 'self'", // Only fonts from same origin
          "connect-src 'self'", // Only connections to same origin
          "frame-ancestors 'none'", // Never allow embedding
          "base-uri 'none'", // No base tag allowed
          "form-action 'none'", // No form submissions
        ].join('; '),
        override: true,
      },
    },
  },
} as const;

/**
 * Custom headers that can be added to responses
 * Useful for additional security or debugging information
 */
export const CustomHeaders = {
  /**
   * Headers for development environment
   * Includes debugging and development-friendly headers
   */
  DEVELOPMENT: {
    'X-Environment': 'development',
    'X-Debug-Mode': 'enabled',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  },

  /**
   * Headers for production environment
   * Optimized for performance and security
   */
  PRODUCTION: {
    'X-Environment': 'production',
    'X-Content-Type-Options': 'nosniff',
    'X-Powered-By': 'AWS CloudFront',
  },
} as const;

/**
 * Helper function to create response headers policy
 * @param securityLevel - Level of security headers to apply
 * @param customHeaders - Additional custom headers
 * @returns CloudFront ResponseHeadersPolicy configuration
 */
export function createSecurityHeadersPolicy(
  securityLevel: keyof typeof SecurityHeaders = 'STANDARD',
  customHeaders?: Record<string, string>
) {
  const config = SecurityHeaders[securityLevel];

  return {
    ...config,
    customHeadersBehavior: customHeaders
      ? {
          customHeaders: Object.entries(customHeaders).map(
            ([header, value]) => ({
              header,
              value,
              override: false,
            })
          ),
        }
      : undefined,
  };
}

/**
 * CloudFront cache behaviors for different file types
 * Optimizes caching strategy based on content type and update frequency
 */

import {
  AllowedMethods,
  CachePolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';

export const CdnBehaviors = {
  /**
   * Static assets that rarely change (CSS, JS, images with hashed names)
   * Long cache duration for maximum performance
   */
  STATIC_ASSETS: {
    pathPattern: '/static/*',
    cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: true,
    comment: 'Long-term caching for static assets (CSS, JS, images)',
  },
  /**
   * Assets folder for images and media files
   * Medium cache duration with compression
   */
  ASSETS: {
    pathPattern: '/assets/*',
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: true,
    comment: 'Medium-term caching for assets and media files',
  },
  /**
   * Service Worker - Never cache for immediate updates
   * Critical for PWA functionality and app updates
   */
  SERVICE_WORKER: {
    pathPattern: '/service-worker.js',
    cachePolicy: CachePolicy.CACHING_DISABLED,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: false,
    comment: 'No caching for service worker to ensure immediate updates',
  },
  /**
   * PWA Manifest - Short cache for app metadata
   * Allows quick updates to app configuration
   */
  MANIFEST: {
    pathPattern: '/manifest.json',
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: true,
    comment: 'Short-term caching for PWA manifest',
  },
  /**
   * API endpoints - No caching for dynamic content
   * Ensures fresh data for all API calls
   */
  API: {
    pathPattern: '/api/*',
    cachePolicy: CachePolicy.CACHING_DISABLED,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_ALL,
    compress: true,
    comment: 'No caching for API endpoints',
  },
  /**
   * Favicon and root-level files
   * Medium cache duration for site icons
   */
  FAVICON: {
    pathPattern: '/favicon.ico',
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: false, // Already optimized
    comment: 'Medium-term caching for favicon',
  },
} as const;

/**
 * Helper function to get behavior configuration
 * @param behaviorType - Type of behavior to retrieve
 * @returns CloudFront behavior configuration
 */
export function getAllBehaviors(): Record<
  string,
  Omit<typeof CdnBehaviors.STATIC_ASSETS, 'pathPattern' | 'comment'>
> {
  const behaviors: Record<string, any> = {};
  Object.values(CdnBehaviors).forEach((behavior) => {
    const { pathPattern, comment, ...config } = behavior;
    behaviors[pathPattern] = config;
  });
  return behaviors;
}

# CloudFront Cache Behaviors Configuration - Theory & Concepts

## Table of Contents
1. [Cache Behavior Fundamentals](#cache-behavior-fundamentals)
2. [Path Pattern Matching](#path-pattern-matching)
3. [Cache Policies Explained](#cache-policies-explained)
4. [File Type Optimization](#file-type-optimization)
5. [Progressive Web App (PWA) Support](#progressive-web-app-pwa-support)
6. [Performance vs Freshness Trade-offs](#performance-vs-freshness-trade-offs)
7. [Best Practices](#best-practices)

## Cache Behavior Fundamentals

### What are Cache Behaviors?
- **Path-based rules** - Different caching strategies for different URL patterns
- **Performance optimization** - Serve content faster by caching at edge locations
- **Content freshness** - Balance between speed and up-to-date content
- **Resource efficiency** - Reduce origin server load and bandwidth costs

### How Cache Behaviors Work
```
User Request: example.com/static/css/main.css
1. CloudFront checks path pattern: /static/*
2. Applies STATIC_ASSETS behavior
3. Cache policy: CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS
4. TTL: 1 year (long-term caching)
5. Serves from cache if available, fetches from origin if not
```

### Behavior Priority
```
CloudFront evaluates behaviors in order:
1. Most specific patterns first: /service-worker.js
2. Wildcard patterns: /static/*, /api/*
3. Default behavior: * (catches everything else)
```

## Path Pattern Matching

### Pattern Types
| Pattern | Matches | Example Files |
|---------|---------|---------------|
| `/static/*` | All files in static folder | `/static/css/main.css`, `/static/js/app.js` |
| `/assets/*` | All files in assets folder | `/assets/images/logo.png`, `/assets/fonts/font.woff` |
| `/service-worker.js` | Exact file match | `/service-worker.js` only |
| `/api/*` | All API endpoints | `/api/users`, `/api/products/123` |
| `*.jpg` | All JPEG files | `photo.jpg`, `images/banner.jpg` |

### Pattern Matching Rules
- **Case sensitive** - `/Static/*` ≠ `/static/*`
- **Exact matching** - `/favicon.ico` matches only that file
- **Wildcard matching** - `*` matches any characters
- **Order matters** - More specific patterns should be listed first

### React App File Structure
```
React Build Output:
├── index.html (default behavior)
├── static/
│   ├── css/
│   │   └── main.abc123.css (STATIC_ASSETS behavior)
│   ├── js/
│   │   └── main.def456.js (STATIC_ASSETS behavior)
│   └── media/
│       └── logo.789.png (STATIC_ASSETS behavior)
├── assets/
│   └── images/ (ASSETS behavior)
├── manifest.json (MANIFEST behavior)
├── service-worker.js (SERVICE_WORKER behavior)
└── favicon.ico (FAVICON behavior)
```

## Cache Policies Explained

### CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS
```typescript
cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS
```

**Use case:** Static assets with versioned filenames
**TTL:** 1 year (31,536,000 seconds)
**Best for:** CSS, JS, images with hash in filename
**Why long TTL:** Files with hashed names never change - new versions get new names

### CACHING_OPTIMIZED
```typescript
cachePolicy: CachePolicy.CACHING_OPTIMIZED
```

**Use case:** General static content
**TTL:** 24 hours (86,400 seconds)
**Best for:** Images, fonts, general assets
**Balance:** Good performance with reasonable freshness

### CACHING_DISABLED
```typescript
cachePolicy: CachePolicy.CACHING_DISABLED
```

**Use case:** Dynamic or frequently changing content
**TTL:** 0 seconds (no caching)
**Best for:** APIs, service workers, real-time data
**Trade-off:** Always fresh but slower performance

### Cache Policy Comparison
| Policy | TTL | Use Case | Performance | Freshness |
|--------|-----|----------|-------------|-----------|
| **OPTIMIZED_FOR_UNCOMPRESSED** | 1 year | Versioned assets | Highest | N/A (versioned) |
| **OPTIMIZED** | 24 hours | General content | High | Good |
| **DISABLED** | 0 seconds | Dynamic content | Lowest | Highest |

## File Type Optimization

### Static Assets (`/static/*`)
```typescript
STATIC_ASSETS: {
  pathPattern: '/static/*',
  cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
  compress: true
}
```

**Why this configuration:**
- **Long cache (1 year)** - Files have hash in name, safe to cache forever
- **Compression enabled** - Text files (CSS, JS) compress well
- **GET/HEAD only** - Static files don't need POST/PUT methods

**File examples:**
- `main.abc123.css` - Stylesheet with content hash
- `chunk.def456.js` - JavaScript bundle with hash
- `logo.789.png` - Image with hash (though images don't compress much)

### Assets Folder (`/assets/*`)
```typescript
ASSETS: {
  pathPattern: '/assets/*',
  cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  compress: true
}
```

**Why this configuration:**
- **Medium cache (24 hours)** - Files may not have hashes, need periodic refresh
- **Compression enabled** - Some assets benefit from compression
- **Balanced approach** - Good performance with reasonable freshness

**File examples:**
- `logo.png` - Company logo (no hash)
- `background.jpg` - Background image
- `font.woff2` - Web font file

### Service Worker (`/service-worker.js`)
```typescript
SERVICE_WORKER: {
  pathPattern: '/service-worker.js',
  cachePolicy: CachePolicy.CACHING_DISABLED,
  compress: false
}
```

**Why this configuration:**
- **No caching** - Service worker updates must be immediate
- **No compression** - Small file, compression overhead not worth it
- **Critical for PWAs** - Outdated service worker breaks app updates

**PWA Update Flow:**
1. User visits site
2. Browser checks service worker for updates
3. If cached, user gets old version and app doesn't update
4. With no caching, browser always gets latest service worker

### API Endpoints (`/api/*`)
```typescript
API: {
  pathPattern: '/api/*',
  cachePolicy: CachePolicy.CACHING_DISABLED,
  allowedMethods: AllowedMethods.ALLOW_ALL
}
```

**Why this configuration:**
- **No caching** - API responses are dynamic and user-specific
- **All HTTP methods** - APIs need GET, POST, PUT, DELETE
- **Compression enabled** - JSON responses compress well

## Progressive Web App (PWA) Support

### Service Worker Considerations
```typescript
SERVICE_WORKER: {
  pathPattern: '/service-worker.js',
  cachePolicy: CachePolicy.CACHING_DISABLED,
  compress: false
}
```

**Critical for PWA functionality:**
- **Immediate updates** - New service worker versions deploy instantly
- **Cache management** - Service worker controls its own caching strategy
- **Offline functionality** - Outdated service worker breaks offline features

### Manifest File
```typescript
MANIFEST: {
  pathPattern: '/manifest.json',
  cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  compress: true
}
```

**PWA manifest contains:**
- App name and description
- Icons for home screen
- Theme colors
- Display mode (standalone, fullscreen)
- Start URL

**Why medium caching:**
- Changes occasionally (app updates, new icons)
- Not critical for immediate updates like service worker
- Small file benefits from compression

## Performance vs Freshness Trade-offs

### High Performance (Long Cache)
```typescript
// 1 year cache for versioned assets
cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS
```

**Benefits:**
- ✅ **Instant loading** - Files served from edge cache
- ✅ **Reduced bandwidth** - Less data transfer from origin
- ✅ **Lower costs** - Fewer origin requests
- ✅ **Better user experience** - Faster page loads

**Trade-offs:**
- ❌ **Update delays** - Changes take time to propagate
- ❌ **Cache invalidation complexity** - Manual invalidation needed for urgent updates

### High Freshness (No Cache)
```typescript
// No cache for dynamic content
cachePolicy: CachePolicy.CACHING_DISABLED
```

**Benefits:**
- ✅ **Always current** - Users always get latest content
- ✅ **No cache issues** - No stale content problems
- ✅ **Immediate updates** - Changes visible instantly

**Trade-offs:**
- ❌ **Slower performance** - Every request goes to origin
- ❌ **Higher bandwidth** - More data transfer
- ❌ **Increased costs** - More origin requests

### Balanced Approach (Medium Cache)
```typescript
// 24 hour cache for general content
cachePolicy: CachePolicy.CACHING_OPTIMIZED
```

**Benefits:**
- ✅ **Good performance** - Most requests served from cache
- ✅ **Reasonable freshness** - Content updates daily
- ✅ **Cost effective** - Balanced origin requests

**Best for:**
- Images without version hashes
- Fonts and general assets
- Content that changes occasionally

## Best Practices

### File Naming Strategy
```
✅ Good: Versioned filenames
main.abc123.css → Cache for 1 year
app.def456.js → Cache for 1 year

❌ Bad: Static filenames
main.css → Cache for 24 hours (risk of stale content)
app.js → Cache for 24 hours (risk of stale content)
```

### Cache Hierarchy
```
1. Never cache: APIs, service workers
2. Short cache (1 hour): HTML files
3. Medium cache (24 hours): Images, fonts
4. Long cache (1 year): Versioned CSS/JS
```

### Compression Guidelines
```
✅ Compress: Text files (HTML, CSS, JS, JSON, XML)
✅ Compress: SVG images
❌ Don't compress: Already compressed (JPEG, PNG, WOFF2)
❌ Don't compress: Very small files (<1KB)
```

### HTTP Methods by Content Type
```
Static Assets: GET, HEAD only
API Endpoints: GET, POST, PUT, DELETE, PATCH
Service Worker: GET, HEAD only
Manifest: GET, HEAD only
```

## Monitoring & Optimization

### CloudWatch Metrics to Monitor
- **Cache Hit Rate** - Percentage of requests served from cache
- **Origin Latency** - Time to fetch from S3 when cache miss occurs
- **Request Count** - Total requests per behavior pattern
- **Bytes Downloaded** - Data transfer volume per pattern

### Optimization Strategies
1. **Increase cache hit rate** - Use longer TTLs where appropriate
2. **Monitor popular content** - Pre-warm cache for frequently accessed files
3. **Analyze request patterns** - Identify content that could benefit from longer caching
4. **Review error rates** - Fix broken links that cause 404s

### Cache Invalidation
```bash
# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id E123456 \
  --paths "/service-worker.js" "/manifest.json"

# Invalidate all static assets
aws cloudfront create-invalidation \
  --distribution-id E123456 \
  --paths "/static/*"
```

## Common Issues & Solutions

### Service Worker Not Updating
**Problem:** Users stuck with old app version
**Cause:** Service worker cached by CloudFront
**Solution:** Ensure `CACHING_DISABLED` for service worker path

### CSS/JS Changes Not Visible
**Problem:** Updated styles/scripts not loading
**Cause:** Long cache TTL with non-versioned filenames
**Solution:** Use versioned filenames or shorter TTL

### Slow API Responses
**Problem:** API calls taking too long
**Cause:** API responses being cached when they shouldn't be
**Solution:** Ensure `CACHING_DISABLED` for API paths

### High Origin Costs
**Problem:** Unexpected charges from S3 requests
**Cause:** Low cache hit rate due to short TTLs
**Solution:** Increase TTL for static content, use versioned filenames

## Implementation Example

### Using in CDK Construct
```typescript
import { CdnBehaviors, getAllBehaviors } from './cdn-behaviors'

// In your CloudFront distribution
new Distribution(this, 'Distribution', {
  defaultBehavior: {
    // Default behavior for HTML files
    cachePolicy: CachePolicy.CACHING_OPTIMIZED
  },
  additionalBehaviors: getAllBehaviors()
})
```

### Custom Behavior
```typescript
// Add custom behavior for specific needs
const customBehaviors = {
  ...getAllBehaviors(),
  '/downloads/*': {
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    compress: false // Large files, don't compress
  }
}
```
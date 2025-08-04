// Image optimization utilities
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
  if (!originalUrl) return ''
  
  const { width, height, quality = 80, format = 'webp' } = options
  
  // For Supabase storage URLs, we can add transformation parameters
  if (originalUrl.includes('supabase')) {
    const url = new URL(originalUrl)
    const params = new URLSearchParams()
    
    if (width) params.set('width', width)
    if (height) params.set('height', height)
    if (quality) params.set('quality', quality)
    if (format) params.set('format', format)
    
    if (params.toString()) {
      url.search = params.toString()
    }
    
    return url.toString()
  }
  
  return originalUrl
}

export const generateSrcSet = (originalUrl, sizes = [400, 800, 1200]) => {
  return sizes
    .map(size => `${getOptimizedImageUrl(originalUrl, { width: size })} ${size}w`)
    .join(', ')
}

export const getResponsiveImageProps = (src, alt, options = {}) => {
  const { sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' } = options
  
  return {
    src: getOptimizedImageUrl(src, { width: 800 }),
    srcSet: generateSrcSet(src),
    sizes,
    alt,
    loading: 'lazy',
    decoding: 'async'
  }
}
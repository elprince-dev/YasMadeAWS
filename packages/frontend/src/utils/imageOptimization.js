// Image optimization utilities
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
  if (!originalUrl) return ''
  
  // Supabase storage does not support image transformation query params
  // unless the paid Image Transformations add-on is enabled.
  // Return the original URL as-is to avoid broken images.
  return originalUrl
}

export const generateSrcSet = () => {
  // No-op: Supabase storage doesn't support on-the-fly resizing without the paid add-on
  return undefined
}

export const getResponsiveImageProps = (src, alt) => {
  return {
    src: getOptimizedImageUrl(src),
    alt,
    loading: 'lazy',
    decoding: 'async'
  }
}
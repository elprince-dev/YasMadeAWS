// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now()
    const result = await fn(...args)
    const end = performance.now()
    
    if (import.meta.env.DEV) {
      console.log(`${name} took ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  }
}

export const debounce = (func, wait = UI_CONFIG.debounceDelay) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit = UI_CONFIG.throttleLimit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Preload critical resources
export const preloadImage = (src) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
}

export const preloadRoute = (routeImport) => {
  routeImport()
}
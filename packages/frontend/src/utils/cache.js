import { CACHE_CONFIG } from '../constants'

// Simple client-side cache for API responses
class Cache {
  constructor(ttl = CACHE_CONFIG.defaultTTL) {
    this.cache = new Map()
    this.ttl = ttl
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key) {
    this.cache.delete(key)
  }
}

export const apiCache = new Cache()

export const getCacheKey = (table, params = {}) => {
  const paramString = Object.keys(params).length > 0 
    ? JSON.stringify(params) 
    : ''
  return `${table}:${paramString}`
}
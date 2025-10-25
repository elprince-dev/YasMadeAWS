import { APP_CONFIG } from '../constants'

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Date(date).toLocaleDateString(
    APP_CONFIG.defaultLocale,
    { ...defaultOptions, ...options }
  )
}

export const formatPrice = (price, currency = APP_CONFIG.currency) => {
  if (!price || price === 0) return 'Free'
  return `$${price.toFixed(2)} ${currency}`
}

export const isDateInFuture = (date) => {
  return new Date(date) > new Date()
}

export const getTodayISO = () => {
  return new Date().toISOString()
}
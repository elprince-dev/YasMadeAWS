// Production-safe logging utility
const isDevelopment = import.meta.env.DEV

const sanitizeMessage = (message) => {
  if (typeof message === 'string') {
    return encodeURIComponent(message)
  }
  return encodeURIComponent(String(message))
}

export const logger = {
  error: (message, context = '') => {
    const sanitizedMessage = sanitizeMessage(message)
    const sanitizedContext = context ? sanitizeMessage(context) : ''
    
    if (isDevelopment) {
      console.error(`[ERROR] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '')
    }
    // In production, you could send to a logging service here
  },
  
  warn: (message, context = '') => {
    const sanitizedMessage = sanitizeMessage(message)
    const sanitizedContext = context ? sanitizeMessage(context) : ''
    
    if (isDevelopment) {
      console.warn(`[WARN] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '')
    }
  },
  
  info: (message, context = '') => {
    const sanitizedMessage = sanitizeMessage(message)
    const sanitizedContext = context ? sanitizeMessage(context) : ''
    
    if (isDevelopment) {
      console.info(`[INFO] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '')
    }
  }
}
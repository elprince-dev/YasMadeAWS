import { useState } from 'react'
import { logger } from '../utils/logger'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)

  const handleError = (error, context = '') => {
    const errorMessage = error?.message || 'An unexpected error occurred'
    logger.error(errorMessage, context)
    setError(errorMessage)
  }

  const clearError = () => setError(null)

  return { error, handleError, clearError }
}
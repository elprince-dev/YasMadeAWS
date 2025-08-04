// Simple CSRF protection utility
export const generateCSRFToken = () => {
  return crypto.randomUUID()
}

export const setCSRFToken = (token) => {
  sessionStorage.setItem('csrf_token', token)
}

export const getCSRFToken = () => {
  return sessionStorage.getItem('csrf_token')
}

export const validateCSRFToken = (token) => {
  const storedToken = getCSRFToken()
  return storedToken && storedToken === token
}

export const initCSRF = () => {
  if (!getCSRFToken()) {
    const token = generateCSRFToken()
    setCSRFToken(token)
  }
}
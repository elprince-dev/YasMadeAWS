// Environment variable validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export const getEnvVar = (name, defaultValue = null) => {
  const value = import.meta.env[name]
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value || defaultValue
}

export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD
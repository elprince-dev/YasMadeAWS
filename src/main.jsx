import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { SupabaseProvider } from './contexts/SupabaseContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { validateEnvironment } from './utils/env.js'
import './index.css'

// Validate environment variables on startup
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error.message)
  throw error
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>,
)
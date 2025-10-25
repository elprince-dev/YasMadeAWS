import { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'
import { UI_CONFIG } from '../constants'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const toastIcons = {
  success: FiCheck,
  error: FiX,
  warning: FiAlertCircle,
  info: FiInfo
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white'
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = UI_CONFIG.toastDuration) => {
    const id = Date.now()
    const toast = { id, message, type }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = toastIcons[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`flex items-center p-4 rounded-lg shadow-lg max-w-sm ${toastStyles[toast.type]}`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-3 hover:opacity-75"
                  aria-label="Close notification"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
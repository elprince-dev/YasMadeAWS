import { useEffect } from 'react'

export const useKeyboardNavigation = (isOpen, onClose, onConfirm) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose?.()
          break
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            onConfirm?.()
          }
          break
        case 'Tab':
          // Trap focus within modal/dialog
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0]
          const lastElement = focusableElements[focusableElements.length - 1]

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm])
}
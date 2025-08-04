import LoadingSpinner from './LoadingSpinner'

function LoadingState({ message = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}

export default LoadingState
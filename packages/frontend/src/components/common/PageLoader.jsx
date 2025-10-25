import { motion } from 'framer-motion'

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </motion.div>
    </div>
  )
}

export default PageLoader
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'

function SessionRegistrationSuccessPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <FiCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
          <h1 className="heading-2 mb-4">Registration Successful!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Thank you for registering for the session. We look forward to seeing you there!
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/sessions" className="btn-primary">
              View More Sessions
            </Link>
            <Link to="/" className="btn-secondary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SessionRegistrationSuccessPage
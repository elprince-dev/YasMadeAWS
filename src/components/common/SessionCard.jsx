import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiCalendar } from 'react-icons/fi'
import LazyImage from './LazyImage'
import { formatDate, formatPrice } from '../../utils/dateHelpers'

function SessionCard({ session }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover overflow-hidden"
    >
      <Link to={`/sessions/${session.id}`}>
        {session.image_url && (
          <div className="aspect-video overflow-hidden">
            <LazyImage
              src={session.image_url}
              alt={session.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {session.title}
          </h2>
          <div className="flex items-center mb-4 text-gray-600 dark:text-gray-400">
            <FiCalendar className="w-5 h-5 mr-2" />
            {formatDate(session.session_date)}
            {session.session_time && ` • ${session.session_time}`}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {session.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(session.price)}
            </span>
            <span className="btn-primary py-2 px-4">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default SessionCard
import { motion } from 'framer-motion';
import { FiCalendar } from 'react-icons/fi';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import LoadingState from '../components/common/LoadingState';
import SessionCard from '../components/common/SessionCard';
import EmptyState from '../components/common/EmptyState';
import { API_ENDPOINTS } from '../constants';
import { getTodayISO } from '../utils/dateHelpers';

function SessionsPage() {
  const { data: sessions, loading, error } = useSupabaseQuery(API_ENDPOINTS.sessions, {
    filters: { session_date: `gt.${getTodayISO()}` },
    orderBy: { column: 'session_date', ascending: false }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Creative Workshops</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join our creative workshops and explore the art of handmade embroidery.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading workshops..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load workshops</p>
          </div>
        ) : (
          <>
            {sessions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiCalendar}
                title="No sessions available"
                description="Check back soon for new creative sessions."
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default SessionsPage;
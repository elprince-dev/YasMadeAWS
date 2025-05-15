import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '../contexts/SupabaseContext';
import { Link } from 'react-router-dom';
import { FiCalendar } from 'react-icons/fi';

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { supabase } = useSupabase();

  useEffect(() => {
    async function fetchSessions() {
      const today = new Date().toISOString()
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .gt('session_date', today)
          .order('session_date', { ascending: false });

        if (error) {
          throw error;
        }

        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [supabase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Creative Sessions</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join our creative sessions and explore the art of handmade embroidery.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse card p-4">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card card-hover overflow-hidden"
                  >
                    <Link to={`/sessions/register/${session.id}`}>
                      {session.image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
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
                          {new Date(session.session_date).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                          {session.session_time && ` • ${session.session_time}`}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {session.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            ${session.price?.toFixed(2) || 'Free'}
                          </span>
                          <span className="btn-primary py-2 px-4">
                            Register Now
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No sessions available
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for new creative sessions.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default SessionsPage;
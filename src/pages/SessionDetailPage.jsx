import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle } from 'react-icons/fi'

function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSessionData() {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .single()

        if (sessionError) throw sessionError

        setSession(sessionData)
      } catch (error) {
        console.error('Error fetching session data:', error)
        setError('Failed to load session details')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [id, supabase])

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { count } = await supabase
        .from('session_registrations')
        .select('*', { count: 'exact' })
        .eq('session_id', id)

      if (session.max_participants && count >= session.max_participants) {
        throw new Error('Sorry, this session is now full')
      }

      const { error } = await supabase
        .from('session_registrations')
        .insert([{
          session_id: id,
          form_data: formData
        }])

      if (error) throw error

      navigate('/sessions/registration-success')
    } catch (error) {
      console.error('Error submitting registration:', error)
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="heading-2 mb-4">Session Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || "The session you're looking for doesn't exist or has been removed."}
            </p>
            <button
              onClick={() => navigate('/sessions')}
              className="btn-primary"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {session.image_url && (
            <div className="mb-8">
              <img
                src={session.image_url}
                alt={session.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          
          <h1 className="heading-2 mb-6">{session.title}</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiCalendar className="w-5 h-5 mr-2" />
                {new Date(session.session_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              {session.session_time && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiClock className="w-5 h-5 mr-2" />
                  {session.session_time}
                </div>
              )}
              {session.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiMapPin className="w-5 h-5 mr-2" />
                  {session.location}
                </div>
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiUsers className="w-5 h-5 mr-2" />
                {session.max_participants ? `${session.max_participants} spots available` : 'Unlimited spots'}
              </div>
            </div>
            <div className="mt-4 text-gray-600 dark:text-gray-400">
              {session.description}
            </div>
            {session.price > 0 && (
              <div className="mt-4 text-lg font-semibold text-primary-600 dark:text-primary-400">
                Price: ${session.price.toFixed(2)}
              </div>
            )}
          </div>

          {session.google_form_link ? (
            <a
              href={session.google_form_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center"
            >
              Register Now
            </a>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Registration Not Available
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300">
                Registration for this session is not yet open. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default SessionDetailPage
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle } from 'react-icons/fi'

function SessionRegistrationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const [session, setSession] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [registrationsClosed, setRegistrationsClosed] = useState(false)
  const [currentRegistrations, setCurrentRegistrations] = useState(0)

  useEffect(() => {
    async function fetchSessionData() {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .single()

        if (sessionError) throw sessionError

        const { count, error: countError } = await supabase
          .from('session_registrations')
          .select('*', { count: 'exact' })
          .eq('session_id', id)

        if (countError) throw countError

        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('session_id', id)
          .order('order_position')

        if (fieldsError) throw fieldsError

        setSession(sessionData)
        setCurrentRegistrations(count)
        setRegistrationsClosed(sessionData.max_participants && count >= sessionData.max_participants)
        setFormFields(fieldsData || [])

        const initialFormData = {}
        fieldsData?.forEach(field => {
          initialFormData[field.field_name] = ''
        })
        setFormData(initialFormData)
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
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
              <img
                src={session.image_url}
                alt={session.title}
                className="w-full h-[400px] object-cover"
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
                {currentRegistrations} / {session.max_participants || '∞'} registered
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

          {registrationsClosed ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Registration Closed
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300">
                This session has reached its maximum capacity of {session.max_participants} participants.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Registration Form</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {formFields.map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.field_name}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {field.field_label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        id={field.field_name}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={(e) => handleInputChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                    
                    {field.field_type === 'email' && (
                      <input
                        type="email"
                        id={field.field_name}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={(e) => handleInputChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                    
                    {field.field_type === 'textarea' && (
                      <textarea
                        id={field.field_name}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={(e) => handleInputChange(field.field_name, e.target.value)}
                        required={field.required}
                        rows={4}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                    
                    {field.field_type === 'select' && field.field_options && (
                      <select
                        id={field.field_name}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={(e) => handleInputChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select an option</option>
                        {field.field_options.split(',').map((option) => (
                          <option key={option.trim()} value={option.trim()}>
                            {option.trim()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Submitting...' : 'Register for Session'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default SessionRegistrationPage
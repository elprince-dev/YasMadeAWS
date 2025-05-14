import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiDownload, FiTrash2, FiUserPlus, FiFilter, FiX, FiEye } from 'react-icons/fi'

function AdminRegistrations() {
  const { supabase } = useSupabase()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [newRegistration, setNewRegistration] = useState({
    session_id: '',
    form_data: {}
  })
  const [sessions, setSessions] = useState([])
  const [formFields, setFormFields] = useState([])
  
  // Filtering state
  const [filters, setFilters] = useState({
    session: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (newRegistration.session_id) {
      fetchFormFields(newRegistration.session_id)
    }
  }, [newRegistration.session_id])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch registrations with session details
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('session_registrations')
        .select(`
          *,
          sessions (
            id,
            title,
            session_date,
            session_time,
            max_participants
          )
        `)
        .order('created_at', { ascending: false })

      if (registrationsError) throw registrationsError

      // Fetch available sessions for the add form and filters
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('session_date', { ascending: false })

      if (sessionsError) throw sessionsError

      setRegistrations(registrationsData || [])
      setSessions(sessionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFormFields(sessionId) {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_position')

      if (error) throw error

      setFormFields(data || [])
      
      // Initialize form data with empty values
      const initialFormData = {}
      data?.forEach(field => {
        initialFormData[field.field_name] = ''
      })
      setNewRegistration(prev => ({
        ...prev,
        form_data: initialFormData
      }))
    } catch (error) {
      console.error('Error fetching form fields:', error)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this registration?')) return

    try {
      setError(null)
      const { error } = await supabase
        .from('session_registrations')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update the local state to remove the deleted registration
      setRegistrations(prevRegistrations => 
        prevRegistrations.filter(registration => registration.id !== id)
      )
    } catch (error) {
      console.error('Error deleting registration:', error)
      setError('Failed to delete registration')
    }
  }

  async function handleAddRegistration(e) {
    e.preventDefault()
    try {
      setError(null)
      // Check if session is full
      const session = sessions.find(s => s.id === newRegistration.session_id)
      const currentRegistrations = registrations.filter(r => r.session_id === newRegistration.session_id).length

      if (session.max_participants && currentRegistrations >= session.max_participants) {
        throw new Error('This session is already full')
      }

      const { data, error } = await supabase
        .from('session_registrations')
        .insert([newRegistration])
        .select(`
          *,
          sessions (
            id,
            title,
            session_date,
            session_time,
            max_participants
          )
        `)
        .single()

      if (error) throw error

      setRegistrations(prev => [data, ...prev])
      setShowAddForm(false)
      setNewRegistration({ session_id: '', form_data: {} })
    } catch (error) {
      console.error('Error adding registration:', error)
      setError(error.message)
    }
  }

  const handleFormDataChange = (fieldName, value) => {
    setNewRegistration(prev => ({
      ...prev,
      form_data: {
        ...prev.form_data,
        [fieldName]: value
      }
    }))
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const resetFilters = () => {
    setFilters({
      session: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  const filteredRegistrations = registrations.filter(registration => {
    // Session filter
    if (filters.session && registration.session_id !== filters.session) {
      return false
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const regDate = new Date(registration.created_at)
      if (filters.dateFrom && regDate < new Date(filters.dateFrom)) {
        return false
      }
      if (filters.dateTo && regDate > new Date(filters.dateTo)) {
        return false
      }
    }

    // Search term filter (searches through form data)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const formDataStr = JSON.stringify(registration.form_data).toLowerCase()
      return formDataStr.includes(searchLower)
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['Session', 'Date', 'Time', 'Participant Details', 'Registration Date']
    
    const csvData = filteredRegistrations.map(reg => [
      reg.sessions?.title || 'N/A',
      reg.sessions?.session_date ? new Date(reg.sessions.session_date).toLocaleDateString() : 'N/A',
      reg.sessions?.session_time || 'N/A',
      JSON.stringify(reg.form_data),
      new Date(reg.created_at).toLocaleString()
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-2">Session Registrations</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <FiUserPlus className="w-5 h-5 mr-2" />
              Add Registration
            </button>
            <button
              onClick={exportToCSV}
              className="btn-secondary"
            >
              <FiDownload className="w-5 h-5 mr-2" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FiFilter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
            >
              <FiX className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session
              </label>
              <select
                value={filters.session}
                onChange={(e) => handleFilterChange('session', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search registrations..."
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Add Registration Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Add New Registration</h2>
              <form onSubmit={handleAddRegistration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Session
                  </label>
                  <select
                    value={newRegistration.session_id}
                    onChange={(e) => setNewRegistration(prev => ({ ...prev, session_id: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="">Choose a session...</option>
                    {sessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.title} - {new Date(session.session_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {formFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.field_label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        value={newRegistration.form_data[field.field_name] || ''}
                        onChange={(e) => handleFormDataChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    )}
                    
                    {field.field_type === 'email' && (
                      <input
                        type="email"
                        value={newRegistration.form_data[field.field_name] || ''}
                        onChange={(e) => handleFormDataChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    )}
                    
                    {field.field_type === 'textarea' && (
                      <textarea
                        value={newRegistration.form_data[field.field_name] || ''}
                        onChange={(e) => handleFormDataChange(field.field_name, e.target.value)}
                        required={field.required}
                        rows={3}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    )}
                    
                    {field.field_type === 'select' && field.field_options && (
                      <select
                        value={newRegistration.form_data[field.field_name] || ''}
                        onChange={(e) => handleFormDataChange(field.field_name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
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

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Registration Details Modal */}
        {showDetailModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Registration Details</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRegistration.sessions?.title} - {new Date(selectedRegistration.sessions?.session_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedRegistration.form_data).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {key}
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Registration Date
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(selectedRegistration.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Session Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Participant Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {registration.sessions?.title || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {registration.sessions?.session_date && (
                          <>
                            {new Date(registration.sessions.session_date).toLocaleDateString()}
                            {registration.sessions.session_time && ` • ${registration.sessions.session_time}`}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {Object.entries(registration.form_data).slice(0, 2).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                        {Object.keys(registration.form_data).length > 2 && (
                          <div className="text-primary-600 dark:text-primary-400 cursor-pointer"
                               onClick={() => {
                                 setSelectedRegistration(registration)
                                 setShowDetailModal(true)
                               }}>
                            View more...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(registration.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRegistration(registration)
                          setShowDetailModal(true)
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(registration.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Delete Registration"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminRegistrations
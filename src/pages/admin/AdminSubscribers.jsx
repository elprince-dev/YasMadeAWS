import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiUserPlus, FiTrash2, FiMail, FiDownload, FiSend, FiX, FiAlertCircle, FiInfo, FiImage } from 'react-icons/fi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { initCSRF, getCSRFToken } from '../../utils/csrf'

function AdminSubscribers() {
  const { supabase } = useSupabase()
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [addingSubscriber, setAddingSubscriber] = useState(false)
  const [emailContent, setEmailContent] = useState({
    subject: '',
    content: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState(null)
  const quillRef = useRef(null)

  // Quill editor configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'blockquote',
    'list', 'bullet',
    'link', 'image'
  ]

  useEffect(() => {
    initCSRF()
    fetchSubscribers()
  }, [])

  async function fetchSubscribers() {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscribers(data)
    } catch (error) {
      console.error('Error fetching subscribers:', encodeURIComponent(error.message || 'Unknown error'))
      setError('Failed to load subscribers')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      try {
        const editor = quillRef.current?.getEditor()
        if (!editor) return

        const range = editor.getSelection(true)

        // Insert temporary placeholder
        editor.insertText(range.index, 'Uploading image...', { 'color': '#999' })
        editor.setSelection(range.index + 1)

        // Generate unique filename
        const fileName = `email-images/${Date.now()}-${file.name}`

        // Upload image to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)

        // Remove placeholder text
        editor.deleteText(range.index, 'Uploading image...'.length)

        // Insert image
        editor.insertEmbed(range.index, 'image', publicUrl)
        editor.setSelection(range.index + 1)
      } catch (error) {
        console.error('Error uploading image:', encodeURIComponent(error.message || 'Unknown error'))
        alert('Failed to upload image. Please try again.')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) return

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSubscribers(subscribers.filter(sub => sub.id !== id))
    } catch (error) {
      console.error('Error deleting subscriber:', encodeURIComponent(error.message || 'Unknown error'))
      alert('Failed to delete subscriber')
    }
  }

  const handleAddSubscriber = async (e) => {
    e.preventDefault()
    setAddingSubscriber(true)
    
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: newEmail }])

      if (error) throw error

      await fetchSubscribers()
      setNewEmail('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding subscriber:', encodeURIComponent(error.message || 'Unknown error'))
      alert('Failed to add subscriber. The email might already be subscribed.')
    } finally {
      setAddingSubscriber(false)
    }
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setSendingEmail(true)
    setEmailError(null)

    try {
      // Validate subject
      if (!emailContent.subject?.trim()) {
        throw new Error('Please provide a subject for the email')
      }

      // Validate content
      const strippedContent = emailContent.content
        ?.replace(/<[^>]*>/g, '')
        .trim()

      if (!strippedContent) {
        throw new Error('Please provide content for the email')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session. Please log in again.')
      }

      // Get logo URL from storage
      const { data: { publicUrl: logoUrl } } = supabase.storage
        .from('images')
        .getPublicUrl('yasmadeLogo.PNG')

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'X-CSRF-Token': getCSRFToken()
        },
        body: JSON.stringify({
          subscribers: subscribers.map(sub => sub.email),
          subject: emailContent.subject.trim(),
          content: emailContent.content,
          logoUrl,
          csrfToken: getCSRFToken()
        })
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      alert('Email sent successfully!')
      setShowEmailForm(false)
      setEmailContent({ subject: '', content: '' })
    } catch (error) {
      console.error('Error sending email:', encodeURIComponent(error.message || 'Unknown error'))
      setEmailError(error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Subscription Date'],
      ...subscribers.map(sub => [
        sub.email,
        new Date(sub.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
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
          <h1 className="heading-2">Manage Subscribers</h1>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowEmailForm(true)}
              className="btn-primary"
              disabled={subscribers.length === 0}
              title={subscribers.length === 0 ? 'No subscribers to email' : undefined}
            >
              <FiSend className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Send Email</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <FiUserPlus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add Subscriber</span>
            </button>
            <button
              onClick={exportToCSV}
              className="btn-secondary"
              disabled={subscribers.length === 0}
            >
              <FiDownload className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Add Subscriber Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Subscriber</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSubscriber}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    placeholder="subscriber@example.com"
                  />
                </div>
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
                    disabled={addingSubscriber}
                    className="btn-primary"
                  >
                    {addingSubscriber ? 'Adding...' : 'Add Subscriber'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Send Email to Subscribers</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Sending to {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailForm(false)
                    setEmailError(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {emailError && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-4 flex items-start">
                    <FiAlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailContent.subject}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                      <ReactQuill
                        ref={quillRef}
                        value={emailContent.content}
                        onChange={(content) => setEmailContent(prev => ({ ...prev, content }))}
                        modules={modules}
                        formats={formats}
                        className="bg-white dark:bg-gray-900 h-[300px]"
                        theme="snow"
                      />
                    </div>
                    <div className="mt-2 flex items-start text-sm text-gray-500 dark:text-gray-400">
                      <FiInfo className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        Click the image icon (<FiImage className="inline w-4 h-4 mx-1" />) in the toolbar to add images to your email.
                      </span>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowEmailForm(false)
                      setEmailError(null)
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || subscribers.length === 0}
                    className="btn-primary min-w-[100px]"
                  >
                    {sendingEmail ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5 mr-2" />
                        Send
                      </>
                    )}
                  </button>
                </div>
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subscribed On
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subscriber.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(subscriber.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(subscriber.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete subscriber"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        <FiMail className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <p className="text-lg font-medium">No subscribers yet</p>
                        <p className="text-sm">New subscribers will appear here when people sign up for your newsletter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminSubscribers
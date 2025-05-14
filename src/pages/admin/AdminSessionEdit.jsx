import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiSave, FiX, FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiUpload } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'

function AdminSessionEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const [session, setSession] = useState({
    title: '',
    description: '',
    session_date: '',
    session_time: '',
    location: '',
    price: 0,
    max_participants: '',
    image_url: ''
  })
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(id ? true : false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSessionData()
    }
  }, [id])

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `sessions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
          }
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setSession(prev => ({
        ...prev,
        image_url: publicUrl
      }))
      setError(null)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  })

  async function fetchSessionData() {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (sessionError) throw sessionError

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('session_id', id)
        .order('order_position')

      if (fieldsError) throw fieldsError

      const formattedData = {
        ...sessionData,
        session_date: sessionData.session_date.split('T')[0]
      }

      setSession(formattedData)
      setFormFields(fieldsData || [])
    } catch (error) {
      console.error('Error fetching session:', error)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setSession(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }))
  }

  const addFormField = () => {
    setFormFields(prev => [
      ...prev,
      {
        field_name: '',
        field_label: '',
        field_type: 'text',
        field_options: '',
        required: false,
        order_position: prev.length
      }
    ])
  }

  const removeFormField = (index) => {
    setFormFields(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormFieldChange = (index, field, value) => {
    setFormFields(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const moveFormField = (index, direction) => {
    setFormFields(prev => {
      const newFields = [...prev]
      const temp = newFields[index]
      newFields[index] = newFields[index + direction]
      newFields[index + direction] = temp
      return newFields.map((field, i) => ({ ...field, order_position: i }))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (id) {
        const { error: sessionError } = await supabase
          .from('sessions')
          .update(session)
          .eq('id', id)

        if (sessionError) throw sessionError

        const { error: fieldsError } = await supabase
          .from('form_fields')
          .delete()
          .eq('session_id', id)

        if (fieldsError) throw fieldsError

        if (formFields.length > 0) {
          const { error: insertError } = await supabase
            .from('form_fields')
            .insert(formFields.map(field => ({
              ...field,
              session_id: id
            })))

          if (insertError) throw insertError
        }
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert([session])
          .select()
          .single()

        if (sessionError) throw sessionError

        if (formFields.length > 0) {
          const { error: fieldsError } = await supabase
            .from('form_fields')
            .insert(formFields.map(field => ({
              ...field,
              session_id: newSession.id
            })))

          if (fieldsError) throw fieldsError
        }
      }

      navigate('/admin/sessions')
    } catch (error) {
      console.error('Error saving session:', error)
      setError('Failed to save session')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
      className="min-h-screen pt-24 pb-12"
    >
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="heading-2">{id ? 'Edit Session' : 'Create New Session'}</h1>
            <button
              onClick={() => navigate('/admin/sessions')}
              className="btn-secondary"
            >
              <FiX className="w-5 h-5 mr-2" />
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Session Details</h2>
              
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Image
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {session.image_url ? (
                    <div className="space-y-4">
                      <img
                        src={session.image_url}
                        alt="Session"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {uploading ? 'Uploading...' : 'Drag & drop a new image to replace, or click to select'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUpload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {uploading ? 'Uploading...' : 'Drag & drop an image here, or click to select'}
                      </p>
                    </div>
                  )}
                </div>
                {uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={session.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={session.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="session_date"
                      value={session.session_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      name="session_time"
                      value={session.session_time}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={session.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={session.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      name="max_participants"
                      value={session.max_participants}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form Fields */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Registration Form Fields</h2>
                <button
                  type="button"
                  onClick={addFormField}
                  className="btn-secondary"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  Add Field
                </button>
              </div>

              <div className="space-y-6">
                {formFields.map((field, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium">Field {index + 1}</h3>
                      <div className="flex space-x-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveFormField(index, -1)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <FiArrowUp className="w-5 h-5" />
                          </button>
                        )}
                        {index < formFields.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveFormField(index, 1)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <FiArrowDown className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFormField(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={field.field_name}
                          onChange={(e) => handleFormFieldChange(index, 'field_name', e.target.value)}
                          required
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Field Label
                        </label>
                        <input
                          type="text"
                          value={field.field_label}
                          onChange={(e) => handleFormFieldChange(index, 'field_label', e.target.value)}
                          required
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Field Type
                        </label>
                        <select
                          value={field.field_type}
                          onChange={(e) => handleFormFieldChange(index, 'field_type', e.target.value)}
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Select</option>
                        </select>
                      </div>

                      {field.field_type === 'select' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={field.field_options}
                            onChange={(e) => handleFormFieldChange(index, 'field_options', e.target.value)}
                            placeholder="Option 1, Option 2, Option 3"
                            required
                            className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                          />
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required}
                          onChange={(e) => handleFormFieldChange(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Required field
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {formFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No form fields added yet. Click "Add Field" to create your registration form.
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center"
            >
              <FiSave className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Session'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminSessionEdit
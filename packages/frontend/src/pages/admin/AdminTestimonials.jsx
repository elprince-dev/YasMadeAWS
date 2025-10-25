import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useToast } from '../../contexts/ToastContext'
import { FiPlus, FiEdit, FiTrash2, FiHeart, FiUpload } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'

function AdminTestimonials() {
  const { supabase } = useSupabase()
  const { addToast } = useToast()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    feedback: '',
    image_url: '',
    is_featured: false
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      console.log('Fetching testimonials...')
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Database error details:', error)
        addToast(`Database error: ${error.message} (Code: ${error.code})`, 'error')
        throw error
      }
      setTestimonials(data || [])
      console.log('Testimonials loaded successfully:', data?.length || 0)
    } catch (error) {
      console.error('Fetch error details:', error)
      addToast(`Failed to load testimonials: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    console.log('File selected:', { name: file.name, size: file.size, type: file.type })
    
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `testimonials/${fileName}`
      
      console.log('Uploading to:', filePath)

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      console.log('Upload response:', { data, error: uploadError })

      
      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
        
      console.log('Public URL:', publicUrl)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      addToast('Image uploaded successfully!', 'success')
    } catch (error) {
      console.error('Image upload error:', error)
      addToast(`Failed to upload image: ${error.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }, [supabase, addToast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: uploading
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      console.log('Submitting testimonial:', formData)
      
      if (editingId) {
        const { data, error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingId)
          .select()
        console.log('Update response:', { data, error })
        if (error) throw error
        addToast('Testimonial updated successfully!', 'success')
      } else {
        const { data, error } = await supabase
          .from('testimonials')
          .insert([formData])
          .select()
        console.log('Insert response:', { data, error })
        if (error) throw error
        addToast('Testimonial added successfully!', 'success')
      }
      
      resetForm()
      fetchTestimonials()
    } catch (error) {
      console.error('Save error details:', error)
      addToast(`Failed to save testimonial: ${error.message} (Code: ${error.code || 'unknown'})`, 'error')
    }
  }

  const handleEdit = (testimonial) => {
    setFormData(testimonial)
    setEditingId(testimonial.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error
      addToast('Testimonial deleted successfully!', 'success')
      fetchTestimonials()
    } catch (error) {
      addToast('Failed to delete testimonial', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', feedback: '', image_url: '', is_featured: false })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12">
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
      className="min-h-screen py-12"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-2">Manage Testimonials</h1>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add Testimonial
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      placeholder="First name only"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Feedback</label>
                    <textarea
                      value={formData.feedback}
                      onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                      required
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      placeholder="What they said about the workshop..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image (Optional)</label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-700'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input {...getInputProps()} />
                      {formData.image_url ? (
                        <div className="space-y-4">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {uploading ? 'Uploading...' : 'Click or drag to replace image'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FiUpload className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {uploading ? 'Uploading...' : 'Upload embroidery hoop photo'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm">
                      Featured testimonial
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {editingId ? 'Update' : 'Add'} Testimonial
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative"
            >
              {testimonial.is_featured && (
                <FiHeart className="absolute top-4 right-4 w-5 h-5 text-pink-500 fill-current" />
              )}
              
              {testimonial.image_url && (
                <img
                  src={testimonial.image_url}
                  alt={`${testimonial.name}'s work`}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              
              <h3 className="font-semibold text-lg mb-2">{testimonial.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                "{testimonial.feedback}"
              </p>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(testimonial.id)}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {testimonials.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FiHeart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No testimonials yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add your first testimonial to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default AdminTestimonials
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { FiSave, FiX, FiUpload } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { useErrorHandler } from '../../hooks/useErrorHandler'

function AdminBlogEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const [blog, setBlog] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    published: true
  })
  const [loading, setLoading] = useState(id ? true : false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { error, handleError, clearError } = useErrorHandler()

  useEffect(() => {
    if (id) {
      fetchBlog()
    }
  }, [id])

  async function fetchBlog() {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setBlog(data)
    } catch (error) {
      handleError(error, 'fetchBlog')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setBlog(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContentChange = (content) => {
    setBlog(prev => ({
      ...prev,
      content
    }))
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (!file.type.startsWith('image/')) {
      handleError('Please upload an image file')
      return
    }

    // // Check if Supabase client is available
    // if (!supabase) {
    //   handleError('Supabase client not initialized')
    //   return
    // }

    try {
      setUploading(true)
      setUploadProgress(0)
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `blogs/${fileName}`

      // // Check if storage is available
      // if (!supabase.storage) {
      //   throw new Error('Supabase storage not available')
      // }

      // // Check if images bucket exists
      // const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      // if (bucketsError) {
      //   console.error('Error listing buckets:', bucketsError)
      //   throw new Error('Cannot access storage buckets')
      // }

      // const imagesBucket = buckets.find(b => b.name === 'images')
      // if (!imagesBucket) {
      //   throw new Error('Images bucket not found')
      // }

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

      setBlog(prev => ({
        ...prev,
        image_url: publicUrl
      }))
      clearError()
    } catch (error) {
      console.error('Error uploading image:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      // Check if it's a storage policy error
      if (error.message?.includes('policy') || error.message?.includes('permission')) {
        handleError('Upload failed: Check storage permissions or authentication')
      } else if (error.message?.includes('bucket')) {
        handleError('Upload failed: Storage bucket not found or inaccessible')
      } else {
        handleError(`Failed to upload image: ${error.message}`)
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    clearError()

    try {
      const { error } = id
        ? await supabase
            .from('blogs')
            .update(blog)
            .eq('id', id)
        : await supabase
            .from('blogs')
            .insert([blog])

      if (error) throw error

      navigate('/admin/blogs')
    } catch (error) {
      handleError(error, 'saveBlog')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="heading-2">{id ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
            <button
              onClick={() => navigate('/admin/blogs')}
              className="btn-secondary"
            >
              <FiX className="w-5 h-5 mr-2" />
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={blog.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blog Image
                  </label>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input {...getInputProps()} />
                    {blog.image_url ? (
                      <div className="space-y-4">
                        <img src={blog.image_url} alt="Blog" className="max-h-48 mx-auto rounded-lg" />
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
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={blog.excerpt}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <ReactQuill
                    value={blog.content}
                    onChange={handleContentChange}
                    className="bg-white dark:bg-gray-900 rounded-md"
                    theme="snow"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    name="published"
                    checked={blog.published}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Publish this post
                  </label>
                </div>
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
              {saving ? 'Saving...' : 'Save Blog Post'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminBlogEdit
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useToast } from '../../contexts/ToastContext'
import { FiSave, FiX, FiUpload } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { testStorageConnection } from '../../utils/storageTest'

function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const { addToast } = useToast()
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    featured: false,
    in_stock: true
  })
  const [loading, setLoading] = useState(id ? true : false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
    // Test storage connection on component mount
    testStorageConnection(supabase)
  }, [id, supabase])

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      console.log('No files accepted')
      return
    }

    const file = acceptedFiles[0]
    console.log('File selected:', { name: file.name, size: file.size, type: file.type })
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setError(null)
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        throw new Error('Invalid file type. Please use JPG, PNG, GIF, or WebP')
      }
      
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${fileName}`

      console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type })

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      setProduct(prev => ({
        ...prev,
        image_url: publicUrl
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError(error.message || 'Failed to upload image')
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

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { error } = id
        ? await supabase
            .from('products')
            .update(product)
            .eq('id', id)
        : await supabase
            .from('products')
            .insert([product])

      if (error) throw error

      addToast(
        id ? 'Product updated successfully!' : 'Product created successfully!',
        'success'
      )
      navigate('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      setError('Failed to save product: ' + error.message)
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
            <h1 className="heading-2">{id ? 'Edit Product' : 'Create New Product'}</h1>
            <button
              onClick={() => navigate('/admin/products')}
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
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
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
                    value={product.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Image
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
                    {product.image_url ? (
                      <div className="space-y-4">
                        <img
                          src={product.image_url}
                          alt="Product"
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

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={product.featured}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Featured Product
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="in_stock"
                      name="in_stock"
                      checked={product.in_stock}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="in_stock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      In Stock
                    </label>
                  </div>
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
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminProductEdit
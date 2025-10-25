import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useToast } from '../../contexts/ToastContext'
import { FiSave, FiX, FiUpload, FiTrash2, FiMove } from 'react-icons/fi'
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
  const [productImages, setProductImages] = useState([])
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
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)
    
    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }
        
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`)
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
          throw new Error(`${file.name} has invalid file type`)
        }
        
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        return {
          id: uuidv4(),
          image_url: publicUrl,
          order_position: productImages.length + index
        }
      })

      const newImages = await Promise.all(uploadPromises)
      setProductImages(prev => [...prev, ...newImages])
      
      // Update main product image_url to first image
      if (newImages.length > 0) {
        const allImages = [...productImages, ...newImages]
        setProduct(prev => ({ ...prev, image_url: allImages[0].image_url }))
      }
    } catch (error) {
      setError(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }, [supabase, productImages.length, product.image_url])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: uploading
  })

  async function fetchProduct() {
    try {
      const [productResult, imagesResult] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('order_position')
      ])

      if (productResult.error) throw productResult.error
      if (imagesResult.error) throw imagesResult.error

      setProduct(productResult.data)
      
      // If no images in product_images table but product has image_url, migrate it
      if (imagesResult.data.length === 0 && productResult.data.image_url) {
        const migratedImage = {
          id: uuidv4(),
          image_url: productResult.data.image_url,
          order_position: 0
        }
        setProductImages([migratedImage])
      } else {
        setProductImages(imagesResult.data || [])
      }
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

  const removeImage = (imageId) => {
    setProductImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      // Update main image_url if we removed the first image
      if (prev[0]?.id === imageId && filtered.length > 0) {
        setProduct(current => ({ ...current, image_url: filtered[0].image_url }))
      } else if (filtered.length === 0) {
        setProduct(current => ({ ...current, image_url: '' }))
      }
      return filtered
    })
  }

  const moveImage = (imageId, direction) => {
    setProductImages(prev => {
      const images = [...prev]
      const index = images.findIndex(img => img.id === imageId)
      if (index === -1) return images
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= images.length) return images
      
      [images[index], images[newIndex]] = [images[newIndex], images[index]]
      const reordered = images.map((img, i) => ({ ...img, order_position: i }))
      
      // Update main image_url to first image
      setProduct(current => ({ ...current, image_url: reordered[0].image_url }))
      return reordered
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let productId = id
      
      if (id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', id)
        if (error) throw error
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
          .single()
        if (error) throw error
        productId = data.id
      }

      // Save product images
      if (productImages.length > 0) {
        // Delete existing images for updates
        if (id) {
          await supabase.from('product_images').delete().eq('product_id', id)
        }
        
        // Insert new images
        const imagesToInsert = productImages.map((img, index) => ({
          product_id: productId,
          image_url: img.image_url,
          order_position: index
        }))
        
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert)
        if (imagesError) throw imagesError
      }

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
                    Product Images
                  </label>
                  
                  {/* Existing Images */}
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {productImages.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.image_url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(image.id, 'up')}
                                className="p-1 bg-white rounded-full hover:bg-gray-100"
                                title="Move up"
                              >
                                <FiMove className="w-4 h-4 text-gray-600 transform rotate-180" />
                              </button>
                            )}
                            {index < productImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(image.id, 'down')}
                                className="p-1 bg-white rounded-full hover:bg-gray-100"
                                title="Move down"
                              >
                                <FiMove className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                              title="Remove image"
                            >
                              <FiTrash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                      ${isDragActive 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'}
                      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <FiUpload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {uploading ? 'Uploading...' : 'Drag & drop images here, or click to select multiple images'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        First image will be the main product image
                      </p>
                    </div>
                  </div>
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
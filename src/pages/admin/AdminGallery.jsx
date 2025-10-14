import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useToast } from '../../contexts/ToastContext'
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'

function AdminGallery() {
  const { supabase } = useSupabase()
  const { addToast } = useToast()
  const [galleryImages, setGalleryImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState([])

  useEffect(() => {
    fetchGalleryImages()
  }, [supabase])

  async function fetchGalleryImages() {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGalleryImages(data || [])
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      addToast('Failed to load gallery images', 'error')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const validFiles = []
    
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        addToast('Please upload only image files', 'error')
        continue
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        addToast('Invalid file type. Please use JPG, PNG, GIF, or WebP', 'error')
        continue
      }

      validFiles.push({
        id: uuidv4(),
        file,
        title: file.name.split('.')[0],
        preview: URL.createObjectURL(file)
      })
    }

    setPendingImages(validFiles)
  }, [addToast])

  const uploadPendingImages = async () => {
    if (pendingImages.length === 0) return

    setUploading(true)
    
    try {
      for (const pendingImage of pendingImages) {
        const fileExt = pendingImage.file.name.split('.').pop()?.toLowerCase()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `gallery/${fileName}`

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, pendingImage.file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        // Save to database
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert([{
            title: pendingImage.title,
            image_url: publicUrl
          }])

        if (dbError) throw dbError
      }

      addToast('Images uploaded successfully!', 'success')
      setPendingImages([])
      fetchGalleryImages()
    } catch (error) {
      console.error('Error uploading images:', error)
      addToast('Failed to upload images', 'error')
    } finally {
      setUploading(false)
    }
  }

  const updatePendingTitle = (id, title) => {
    setPendingImages(prev => prev.map(img => 
      img.id === id ? { ...img, title } : img
    ))
  }

  const removePendingImage = (id) => {
    setPendingImages(prev => prev.filter(img => img.id !== id))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: uploading
  })

  async function deleteImage(id, imageUrl) {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const filePath = `gallery/${urlParts[urlParts.length - 1]}`

      // Delete from storage
      await supabase.storage.from('images').remove([filePath])

      // Delete from database
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id)

      if (error) throw error

      addToast('Image deleted successfully', 'success')
      fetchGalleryImages()
    } catch (error) {
      console.error('Error deleting image:', error)
      addToast('Failed to delete image', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-2">Gallery Management</h1>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {uploading ? 'Uploading...' : 'Drag & drop images here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Supports JPG, PNG, GIF, WebP (multiple files allowed)
            </p>
          </div>
        </div>

        {/* Pending Images */}
        {pendingImages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Titles & Upload</h2>
            <div className="space-y-4 mb-6">
              {pendingImages.map((pendingImage) => (
                <div key={pendingImage.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <img
                    src={pendingImage.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={pendingImage.title}
                      onChange={(e) => updatePendingTitle(pendingImage.id, e.target.value)}
                      placeholder="Enter image title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => removePendingImage(pendingImage.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={uploadPendingImages}
                disabled={uploading}
                className="btn-primary flex items-center"
              >
                <FiUpload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Images'}
              </button>
              <button
                onClick={() => setPendingImages([])}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => deleteImage(image.id, image.image_url)}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {image.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : pendingImages.length === 0 ? (
          <div className="text-center py-20">
            <FiPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No gallery images</h3>
            <p className="text-gray-600 dark:text-gray-400">Upload your first gallery image to get started.</p>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

export default AdminGallery
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiSave, FiX } from 'react-icons/fi'

function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    featured: false,
    in_stock: true,
    stripe_product_id: '',
    stripe_price_id: ''
  })
  const [loading, setLoading] = useState(id ? true : false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

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
      // Create or update Stripe product
      const response = await fetch('/api/stripe/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image_url,
          stripeProductId: product.stripe_product_id,
          stripePriceId: product.stripe_price_id
        }),
      })

      const stripeData = await response.json()
      
      if (!response.ok) {
        throw new Error(stripeData.error || 'Failed to sync with Stripe')
      }

      const productData = {
        ...product,
        stripe_product_id: stripeData.productId,
        stripe_price_id: stripeData.priceId
      }

      const { error } = id
        ? await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
        : await supabase
            .from('products')
            .insert([productData])

      if (error) throw error

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={product.image_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  />
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
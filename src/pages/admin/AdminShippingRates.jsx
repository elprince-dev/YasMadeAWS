import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'

function AdminShippingRates() {
  const { supabase } = useSupabase()
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRate, setEditingRate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    estimated_days_min: '',
    estimated_days_max: '',
    is_active: true
  })

  useEffect(() => {
    fetchRates()
  }, [])

  async function fetchRates() {
    try {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRates(data)
    } catch (error) {
      console.error('Error fetching shipping rates:', encodeURIComponent(error.message || 'Unknown error'))
      setError('Failed to load shipping rates')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const prepareRateData = () => ({
    ...formData,
    price: parseFloat(formData.price),
    estimated_days_min: parseInt(formData.estimated_days_min),
    estimated_days_max: parseInt(formData.estimated_days_max)
  })

  const saveRate = async (rateData) => {
    return editingRate
      ? await supabase.from('shipping_rates').update(rateData).eq('id', editingRate.id)
      : await supabase.from('shipping_rates').insert([rateData])
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingRate(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      estimated_days_min: '',
      estimated_days_max: '',
      is_active: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const rateData = prepareRateData()
      const { error } = await saveRate(rateData)
      
      if (error) throw error

      await fetchRates()
      resetForm()
    } catch (error) {
      console.error('Error saving shipping rate:', encodeURIComponent(error.message || 'Unknown error'))
      setError('Failed to save shipping rate')
    }
  }

  const handleEdit = (rate) => {
    setEditingRate(rate)
    setFormData({
      name: rate.name,
      description: rate.description || '',
      price: rate.price.toString(),
      estimated_days_min: rate.estimated_days_min?.toString() || '',
      estimated_days_max: rate.estimated_days_max?.toString() || '',
      is_active: rate.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipping rate?')) return

    try {
      const { error } = await supabase
        .from('shipping_rates')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRates(rates.filter(rate => rate.id !== id))
    } catch (error) {
      console.error('Error deleting shipping rate:', encodeURIComponent(error.message || 'Unknown error'))
      setError('Failed to delete shipping rate')
    }
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
          <h1 className="heading-2">Manage Shipping Rates</h1>
          <button
            onClick={() => {
              setEditingRate(null)
              resetForm()
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add Shipping Rate
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">
                {editingRate ? 'Edit Shipping Rate' : 'Add New Shipping Rate'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (CAD)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min. Days
                    </label>
                    <input
                      type="number"
                      name="estimated_days_min"
                      value={formData.estimated_days_min}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max. Days
                    </label>
                    <input
                      type="number"
                      name="estimated_days_max"
                      value={formData.estimated_days_max}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingRate ? 'Update' : 'Add'} Rate
                  </button>
                </div>
              </form>
            </div>
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delivery Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {rate.name}
                      </div>
                      {rate.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {rate.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${rate.price.toFixed(2)} CAD
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {rate.estimated_days_min && rate.estimated_days_max
                        ? `${rate.estimated_days_min}-${rate.estimated_days_max} days`
                        : 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rate.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {rate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rate.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No shipping rates found
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

export default AdminShippingRates
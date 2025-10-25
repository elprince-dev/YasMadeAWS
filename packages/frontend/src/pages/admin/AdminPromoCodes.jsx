import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'

function AdminPromoCodes() {
  const { supabase } = useSupabase()
  const [promoCodes, setPromoCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    starts_at: '',
    expires_at: '',
    max_uses: '',
    is_active: true
  })

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  async function fetchPromoCodes() {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPromoCodes(data)
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      setError('Failed to load promo codes')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const codeData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
      }

      const { error } = editingCode
        ? await supabase
            .from('promo_codes')
            .update(codeData)
            .eq('id', editingCode.id)
        : await supabase
            .from('promo_codes')
            .insert([codeData])

      if (error) throw error

      await fetchPromoCodes()
      setShowForm(false)
      setEditingCode(null)
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        starts_at: '',
        expires_at: '',
        max_uses: '',
        is_active: true
      })
    } catch (error) {
      console.error('Error saving promo code:', error)
      setError('Failed to save promo code')
    }
  }

  const handleEdit = (code) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      min_purchase_amount: code.min_purchase_amount?.toString() || '',
      max_discount_amount: code.max_discount_amount?.toString() || '',
      starts_at: new Date(code.starts_at).toISOString().split('T')[0],
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : '',
      max_uses: code.max_uses?.toString() || '',
      is_active: code.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPromoCodes(promoCodes.filter(code => code.id !== id))
    } catch (error) {
      console.error('Error deleting promo code:', error)
      setError('Failed to delete promo code')
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
          <h1 className="heading-2">Manage Promo Codes</h1>
          <button
            onClick={() => {
              setEditingCode(null)
              setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_purchase_amount: '',
                max_discount_amount: '',
                starts_at: '',
                expires_at: '',
                max_uses: '',
                is_active: true
              })
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add Promo Code
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
                {editingCode ? 'Edit Promo Code' : 'Add New Promo Code'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(CAD)'}
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Purchase Amount (CAD)
                  </label>
                  <input
                    type="number"
                    name="min_purchase_amount"
                    value={formData.min_purchase_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Discount Amount (CAD)
                  </label>
                  <input
                    type="number"
                    name="max_discount_amount"
                    value={formData.max_discount_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="starts_at"
                      value={formData.starts_at}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expires_at"
                      value={formData.expires_at}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    name="max_uses"
                    value={formData.max_uses}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
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
                    {editingCode ? 'Update' : 'Add'} Code
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
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
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
                {promoCodes.map((code) => (
                  <tr key={code.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {code.code}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {code.min_purchase_amount && (
                          <span>Min. ${code.min_purchase_amount} CAD</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {code.discount_type === 'percentage'
                          ? `${code.discount_value}%`
                          : `$${code.discount_value} CAD`}
                      </div>
                      {code.max_discount_amount && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Max. ${code.max_discount_amount} CAD
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {code.current_uses || 0} used
                      </div>
                      {code.max_uses && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Max. {code.max_uses} uses
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        code.is_active && (!code.expires_at || new Date(code.expires_at) > new Date())
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {code.is_active
                          ? code.expires_at && new Date(code.expires_at) <= new Date()
                            ? 'Expired'
                            : 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(code)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No promo codes found
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

export default AdminPromoCodes
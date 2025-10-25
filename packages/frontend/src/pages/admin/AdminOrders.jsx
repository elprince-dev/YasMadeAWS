import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiPackage, FiTruck, FiCheck, FiX, FiFilter, FiDownload, FiEye } from 'react-icons/fi'

function AdminOrders() {
  const { supabase } = useSupabase()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingSuccess, setTrackingSuccess] = useState(false);

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (showModal && selectedOrder) {
      setTrackingInput(selectedOrder.tracking_number || '');
    }
  }, [showModal, selectedOrder]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_rates (*),
          promo_codes (*),
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const handleTrackingUpdate = async (orderId, trackingNumber) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, tracking_number: trackingNumber } : order
      ))
      setTrackingSuccess(true);
      setTimeout(() => setTrackingSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating tracking number:', error)
      alert('Failed to update tracking number')
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const orderDate = new Date(order.created_at)
      if (filters.dateFrom && orderDate < new Date(filters.dateFrom)) {
        return false
      }
      if (filters.dateTo && orderDate > new Date(filters.dateTo)) {
        return false
      }
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      return (
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_email.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Email',
      'Status',
      'Subtotal',
      'Shipping',
      'Discount',
      'Total',
      'Tracking Number'
    ]

    const csvData = filteredOrders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleString(),
      order.customer_name,
      order.customer_email,
      order.status,
      order.subtotal,
      order.shipping_fee,
      order.discount_amount,
      order.total_amount,
      order.tracking_number || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
          <h1 className="heading-2">Manage Orders</h1>
          <button
            onClick={exportToCSV}
            className="btn-secondary"
          >
            <FiDownload className="w-5 h-5 mr-2" />
            Export to CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FiFilter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
            >
              <FiX className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search orders..."
                className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

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
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            #{order.id.slice(0, 8)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {order.customer_name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {order.customer_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${order.total_amount.toFixed(2)} CAD
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {order.order_items?.length || 0} items
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowModal(true)
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Order #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Order Status</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Tracking Number */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Tracking Information</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number"
                    className="flex-1 px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <button
                    onClick={() => handleTrackingUpdate(selectedOrder.id, trackingInput)}
                    className="btn-primary py-2"
                  >
                    Update
                  </button>
                </div>
                {trackingSuccess && (
                  <div className="mt-2 text-green-700 bg-green-50 dark:bg-green-900/20 rounded p-2 text-sm text-center">
                    Tracking number updated successfully!
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              {selectedOrder.payment_proof && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Payment Proof</h3>
                  <div className="flex flex-col items-center">
                    <a href={selectedOrder.payment_proof} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedOrder.payment_proof}
                        alt="Payment Proof"
                        className="max-h-64 rounded shadow border border-gray-200 dark:border-gray-700"
                      />
                    </a>
                    <p className="text-xs text-gray-500 mt-2 text-center">Click image to view full size.</p>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Shipping Address</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                    <p>{selectedOrder.shipping_address.street}</p>
                    <p>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}
                    </p>
                    <p>{selectedOrder.shipping_address.country}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Billing Address</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.billing_address.name}</p>
                    <p>{selectedOrder.billing_address.street}</p>
                    <p>
                      {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state} {selectedOrder.billing_address.postal_code}
                    </p>
                    <p>{selectedOrder.billing_address.country}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Order Items</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {selectedOrder.order_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img
                                src={item.products?.image_url}
                                alt={item.products?.name}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.products?.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                            ${item.price_at_time.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                            ${(item.price_at_time * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-medium">${selectedOrder.shipping_fee.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-green-600">
                        -${selectedOrder.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-medium">${selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ${selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminOrders
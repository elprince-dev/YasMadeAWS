import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../stores/cartStore';
import { useSupabase } from '../contexts/SupabaseContext';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiUpload } from 'react-icons/fi';

function CartPage() {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingRate, setShippingRate] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    email: '',
    name: '',
    shipping_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Canada'
  });

  useEffect(() => {
    async function fetchShippingRates() {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('is_active', true)
          .order('price');

        if (error) throw error;
        setShippingRates(data);
        if (data.length > 0) setShippingRate(data[0].id);
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
      }
    }
    fetchShippingRates();
  }, []);

  const handleQuantityChange = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_email: orderDetails.email,
          customer_name: orderDetails.name,
          shipping_address: {
            street: orderDetails.shipping_address,
            city: orderDetails.city,
            state: orderDetails.state,
            postal_code: orderDetails.postal_code,
            country: orderDetails.country
          },
          billing_address: {
            street: orderDetails.shipping_address,
            city: orderDetails.city,
            state: orderDetails.state,
            postal_code: orderDetails.postal_code,
            country: orderDetails.country
          },
          shipping_rate_id: shippingRate,
          subtotal: getTotal(),
          shipping_fee: shippingRates.find(rate => rate.id === shippingRate)?.price || 0,
          total_amount: getTotal() + (shippingRates.find(rate => rate.id === shippingRate)?.price || 0),
          status: 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
          }))
        );

      if (itemsError) throw itemsError;

      // Clear cart and redirect to upload page
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen py-24"
      >
        <div className="container-custom">
          <div className="text-center py-12">
            <FiShoppingBag className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Add some beautiful handmade items to your cart
            </p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <h1 className="heading-2 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 ml-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      ${item.price.toFixed(2)} CAD
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        className="p-1 rounded-full border border-gray-300 hover:border-primary-500 transition-colors"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        className="p-1 rounded-full border border-gray-300 hover:border-primary-500 transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Order Details</h2>
              
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={orderDetails.email}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={orderDetails.name}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Street Address</label>
                      <input
                        type="text"
                        required
                        value={orderDetails.shipping_address}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, shipping_address: e.target.value }))}
                        className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <input
                          type="text"
                          required
                          value={orderDetails.city}
                          onChange={(e) => setOrderDetails(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Province</label>
                        <input
                          type="text"
                          required
                          value={orderDetails.state}
                          onChange={(e) => setOrderDetails(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Postal Code</label>
                        <input
                          type="text"
                          required
                          value={orderDetails.postal_code}
                          onChange={(e) => setOrderDetails(prev => ({ ...prev, postal_code: e.target.value }))}
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <input
                          type="text"
                          required
                          value={orderDetails.country}
                          disabled
                          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 opacity-70"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
                  <div className="space-y-4">
                    {shippingRates.map((rate) => (
                      <label key={rate.id} className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          value={rate.id}
                          checked={shippingRate === rate.id}
                          onChange={(e) => setShippingRate(e.target.value)}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-3">
                          <span className="block text-sm font-medium">{rate.name}</span>
                          <span className="block text-sm text-gray-500">
                            ${rate.price.toFixed(2)} • {rate.estimated_days_min}-{rate.estimated_days_max} business days
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${getTotal().toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>
                        ${(shippingRates.find(rate => rate.id === shippingRate)?.price || 0).toFixed(2)} CAD
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total</span>
                      <span>
                        ${(getTotal() + (shippingRates.find(rate => rate.id === shippingRate)?.price || 0)).toFixed(2)} CAD
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/products"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CartPage;
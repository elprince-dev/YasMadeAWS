import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSupabase } from '../contexts/SupabaseContext';
import { FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi';

function OrderConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_rates (
            name,
            price
          ),
          order_items (
            quantity,
            price_at_time,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Update order with payment proof
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_proof: publicUrl,
          payment_status: 'pending'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess(true);
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      setError('Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-24">
        <div className="container-custom">
          <div className="text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">
              The order you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
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
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold mb-6">Order Confirmation</h1>
            
            <div className="mb-8">
              <p className="text-lg mb-4">
                Thank you for your order! Your order number is: <span className="font-semibold">#{order?.id.slice(0, 8)}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Please complete your payment by sending an e-transfer to:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-2">
                <p className="font-semibold">E-transfer Details:</p>
                <p>Email: payment@yasmade.com</p>
                <p>Amount: ${order.total_amount.toFixed(2)} CAD</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please include your order number in the e-transfer message.
                </p>
              </div>
            </div>

            {!success ? (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Upload Payment Proof</h2>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-proof"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="payment-proof"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {uploading ? 'Uploading...' : 'Click to upload e-transfer screenshot'}
                    </span>
                  </label>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8">
                <div className="flex items-center">
                  <FiCheck className="w-6 h-6 text-green-500 mr-2" />
                  <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Payment Proof Uploaded Successfully
                  </h2>
                </div>
                <p className="mt-2 text-green-700 dark:text-green-300">
                  Your order will be reviewed and confirmed within 48 hours. You'll receive an email notification once your payment is confirmed.
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">{item.products.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity} × ${item.price_at_time.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      ${(item.quantity * item.price_at_time).toFixed(2)}
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping ({order.shipping_rates.name})</span>
                    <span>${order.shipping_rates.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>${order.total_amount.toFixed(2)} CAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default OrderConfirmationPage;
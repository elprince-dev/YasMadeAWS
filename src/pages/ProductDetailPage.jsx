import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSupabase } from '../contexts/SupabaseContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import { FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../stores/cartStore';

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const { supabase } = useSupabase();
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProductData() {
      try {
        // Fetch product and images in parallel for better performance
        const [productResult, imagesResult] = await Promise.all([
          supabase.from('products').select('*').eq('id', id).single(),
          supabase.from('product_images').select('*').eq('product_id', id).order('order_position')
        ]);

        if (productResult.error) throw productResult.error;
        if (imagesResult.error) throw imagesResult.error;

        setProduct(productResult.data);
        setProductImages(
          imagesResult.data.length > 0 
            ? imagesResult.data 
            : [{ id: 'main', image_url: productResult.data.image_url }]
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [id, supabase]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 mt-16"
    >
      <div className="grid md:grid-cols-2 gap-8 container-custom">
        <div className="relative">
          {/* Main Swiper */}
          <Swiper
            spaceBetween={10}
            navigation={true}
            pagination={{ clickable: true }}
            thumbs={{ swiper: thumbsSwiper }}
            modules={[Navigation, Pagination, Thumbs]}
            className="rounded-lg overflow-hidden mb-4"
          >
            {productImages.map((image) => (
              <SwiperSlide key={image.id}>
                <img
                  src={image.image_url}
                  alt={product.name}
                  className="w-full h-[500px] object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Thumbs Swiper */}
          {productImages.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              watchSlidesProgress={true}
              modules={[Navigation, Thumbs]}
              className="thumbs-swiper"
            >
              {productImages.map((image) => (
                <SwiperSlide key={image.id}>
                  <div className="cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors">
                    <img
                      src={image.image_url}
                      alt={product.name}
                      className="w-full h-24 object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-6">
            ${product.price.toFixed(2)} CAD
          </p>
          
          <div className="prose max-w-none mb-8">
            <p>{product.description}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Availability:</span>
              <span className={`font-medium ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {product.in_stock && (
              <>
                {/* Quantity Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 rounded-full border border-gray-300 hover:border-primary-500 transition-colors"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 rounded-full border border-gray-300 hover:border-primary-500 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <FiShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProductDetailPage;
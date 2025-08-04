import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LazyImage from '../components/common/LazyImage'
import LoadingState from '../components/common/LoadingState'
import { FiShoppingBag } from 'react-icons/fi'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

function ProductsPage() {
  const { data: products, loading, error } = useSupabaseQuery('products', {
    orderBy: { column: 'created_at', ascending: false }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Handmade Embroidery</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Each piece is carefully crafted with love and attention to detail, bringing beauty and warmth to your home.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading products..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load products</p>
          </div>
        ) : (
          <>
            {products?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card card-hover"
                  >
                    <Link to={`/products/${product.id}`}>
                      <div className="aspect-square overflow-hidden">
                        <LazyImage
                          src={product.image_url || 'https://images.pexels.com/photos/4620467/pexels-photo-4620467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                          {product.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            ${product.price.toFixed(2)}
                          </span>
                          {!product.in_stock && (
                            <span className="text-sm text-red-600 dark:text-red-400">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No products available
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for new handmade embroidery pieces.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

export default ProductsPage
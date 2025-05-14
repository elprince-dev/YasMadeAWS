import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import Hero from '../components/home/Hero'
import {
  FiBookOpen,
  FiShoppingBag
} from 'react-icons/fi'

function HomePage() {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [latestBlogs, setLatestBlogs] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)
      try {
        // Fetch all data in parallel
        const [settingsRes, productsRes, blogsRes, sessionsRes] = await Promise.all([
          supabase.from('settings').select('*'),
          supabase.from('products').select('*').eq('featured', true).limit(3),
          supabase.from('blogs').select('*').order('created_at', { ascending: false }).limit(2),
          supabase.from('sessions').select('*').gt('session_date', new Date().toISOString()).order('session_date').limit(2)
        ])

        if (settingsRes.error) throw settingsRes.error
        if (productsRes.error) throw productsRes.error
        if (blogsRes.error) throw blogsRes.error
        if (sessionsRes.error) throw sessionsRes.error

        setSettings(settingsRes.data[0] || [])
        setFeaturedProducts(productsRes.data || [])
        setLatestBlogs(blogsRes.data || [])
        setUpcomingSessions(sessionsRes.data || [])
      } catch (error) {
        console.error('Error loading data:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [supabase])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <Hero />

      {/* Featured Products Section */}
      <section className="section bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-2 section-title mb-2">Featured Products</h2>
              <p className="text-gray-600 dark:text-gray-400">Handcrafted with love and attention to detail</p>
            </div>
            <Link to="/products" className="btn-secondary">View All</Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="card card-hover overflow-hidden"
                >
                  <Link to={`/products/${product.id}`}>
                    <div className="h-56 overflow-hidden">
                      <img
                        src={product.image_url || 'https://via.placeholder.com/400'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No products yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Featured products will appear here once added.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Latest Blogs Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-2 section-title mb-2">Latest From The Blog</h2>
              <p className="text-gray-600 dark:text-gray-400">Thoughts, inspirations, and creative journeys</p>
            </div>
            <Link to="/blog" className="btn-secondary">Read All</Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {latestBlogs.length > 0 ? (
              latestBlogs.map(blog => (
                <motion.article
                  key={blog.id}
                  variants={itemVariants}
                  className="card card-hover overflow-hidden"
                >
                  <Link to={`/blog/${blog.id}`}>
                    {blog.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={blog.image_url}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {blog.excerpt || blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      <span className="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium">
                        Read more
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))
            ) : (
              <div className="col-span-2 text-center py-10">
                <FiBookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No blog posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Blog posts will appear here once added.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Add Upcoming Sessions Section Here If Needed */}

    </motion.div>
  )
}

export default HomePage

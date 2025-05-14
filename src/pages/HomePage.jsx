import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import Hero from '../components/home/Hero'
import { FiBookOpen, FiCalendar, FiShoppingBag, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

function HomePage() {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
    //---------------------
  const [settings, setSettings] = useState([]);

  //----------------------
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [latestBlogs, setLatestBlogs] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  

  useEffect(() => {
  async function fetchAllData() {
    setLoading(true)
    try {
      const [settingsRes, productsRes, blogsRes, sessionsRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('products').select('*').eq('featured', true).limit(3),
        supabase.from('blogs').select('*').order('created_at', { ascending: false }).limit(2),
        supabase.from('sessions')
          .select('*')
          .gt('session_date', new Date().toISOString())
          .order('session_date')
          .limit(2)
      ])

      if (settingsRes.error) throw settingsRes.error
      if (productsRes.error) throw productsRes.error
      if (blogsRes.error) throw blogsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      setSettings(settingsRes.data[0] || {})
      setFeaturedProducts(productsRes.data || [])
      setLatestBlogs(blogsRes.data || [])
      setUpcomingSessions(sessionsRes.data || [])
      } catch (error) {
        console.error('Error fetching homepage data:', error.message)
      } finally {
        setLoading(false)
      }
    }

  fetchAllData()
}, [supabase])

    
    fetchData()
  }, [supabase])

  // Animation variants
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <Hero />
      
      {/* Featured Products Section */}
      <section className="section bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-2 section-title mb-2">Featured Products</h2>
              <p className="text-gray-600 dark:text-gray-400">Handcrafted with love and attention to detail</p>
            </div>
            <Link to="/products" className="btn-secondary">
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse card p-4 h-80">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <motion.div 
                    key={product.id} 
                    variants={itemVariants}
                    className="card card-hover overflow-hidden"
                  >
                    <Link to={`/products/${product.id}`}>
                      <div className="h-56 overflow-hidden">
                        <img 
                          src={product.image_url || 'https://images.pexels.com/photos/4620467/pexels-photo-4620467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
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
          )}
        </div>
      </section>
      
      {/* Latest Blog Posts Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-2 section-title mb-2">Latest From The Blog</h2>
              <p className="text-gray-600 dark:text-gray-400">Thoughts, inspirations, and creative journeys</p>
            </div>
            <Link to="/blog" className="btn-secondary">
              Read All
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse card p-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-11/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {latestBlogs.length > 0 ? (
                latestBlogs.map((blog) => (
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
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
          )}
        </div>
      </section>
      
      {/* Upcoming Sessions Section */}
      <section className="section bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-2 section-title mb-2">Upcoming Sessions</h2>
              <p className="text-gray-600 dark:text-gray-400">Join us for creative embroidery workshops</p>
            </div>
            <Link to="/sessions" className="btn-secondary">
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse card p-4 h-72">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-11/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-4/5"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <motion.div 
                    key={session.id} 
                    variants={itemVariants}
                    className="card card-hover overflow-hidden"
                  >
                    <Link to={`/sessions/register/${session.id}`}>
                      {session.image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={session.image_url}
                            alt={session.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                          {session.title}
                        </h3>
                        <div className="flex items-center mb-4 text-gray-600 dark:text-gray-400">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          {new Date(session.session_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {session.session_time && ` • ${session.session_time}`}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{session.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            ${session.price?.toFixed(2) || 'Free'}
                          </span>
                          <button className="btn-primary">
                            Register Now
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10">
                  <FiCalendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No upcoming sessions</h3>
                  <p className="text-gray-600 dark:text-gray-400">Sessions will appear here once scheduled.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Get in Touch Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="heading-2 section-title mb-4">The YasMade Story</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                YasMade began as a personal journey of faith expression through the art of embroidery. What started as a quiet evening hobby has blossomed into a passion for creating meaningful pieces that bring beauty and remembrance into Muslim homes.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                Each piece is handcrafted with attention to detail and love, inspired by Islamic art and the beauty of our faith. Beyond creating products, YasMade has grown to include workshops where children can learn this traditional craft in a nurturing environment.
              </p>
              <Link to="/contact" className="btn-primary">
                Get in Touch
              </Link>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <FiMail className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <a href="mailto:info@yasmade.com" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                      {settings?.social_links?.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiPhone className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Phone</h3>
                    <a href="tel:+1234567890" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiMapPin className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Location</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {settings?.social_links?.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default HomePage
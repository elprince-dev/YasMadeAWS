import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import { FiHeart, FiInstagram } from 'react-icons/fi'
import LazyImage from '../components/common/LazyImage'

function TestimonialsPage() {
  const { supabase } = useSupabase()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-violet-50 via-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container-custom">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
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
      className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-violet-50 via-pink-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Stories from Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">Creative Community</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Nothing fills my heart more than hearing how embroidery has brought joy, peace, and creativity into the lives of our workshop participants. 
            Here are some beautiful words from our wonderful community of makers and creators.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-violet-100 dark:border-gray-700 relative overflow-hidden"
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-pink-400"></div>
                
                {/* Featured badge */}
                {testimonial.is_featured && (
                  <div className="absolute top-4 right-4">
                    <FiHeart className="w-5 h-5 text-pink-500 fill-current" />
                  </div>
                )}

                {/* Image */}
                {testimonial.image_url && (
                  <div className="mb-4">
                    <LazyImage
                      src={testimonial.image_url}
                      alt={`${testimonial.name}'s embroidery work`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="space-y-4">
                  <blockquote className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{testimonial.feedback}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-pink-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Workshop Participant
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <FiHeart className="w-16 h-16 mx-auto text-pink-300 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              More Stories Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We're collecting beautiful testimonials from our workshop participants. Check back soon to read their inspiring stories!
            </p>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl p-8 text-center border border-violet-200 dark:border-violet-800"
        >
          <FiHeart className="w-12 h-12 mx-auto text-pink-500 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Share Your Story With Us
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            💜 Attended one of our workshops? We'd love to hear from you! Your story could inspire others to discover the joy of embroidery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.instagram.com/yas_made2409/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-full hover:from-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FiInstagram className="w-5 h-5 mr-2" />
              Share on Instagram
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 font-semibold rounded-full border-2 border-violet-200 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-300"
            >
              Send Us a Message
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default TestimonialsPage
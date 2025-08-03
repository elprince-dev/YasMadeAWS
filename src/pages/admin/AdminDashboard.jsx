import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiPackage, FiEdit3, FiCalendar, FiUsers, FiSettings, FiMail, FiUserPlus, FiTruck, FiTag } from 'react-icons/fi'

function AdminDashboard() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState({
    products: 0,
    blogs: 0,
    sessions: 0,
    messages: 0,
    subscribers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: productsCount, error: productsError },
          { count: blogsCount, error: blogsError },
          { count: sessionsCount, error: sessionsError },
          { count: messagesCount, error: messagesError },
          { count: subscribersCount, error: subscribersError },
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('blogs').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
          supabase.from('subscribers').select('*', { count: 'exact', head: true }),
        ])

        setStats({
          products: productsCount,
          blogs: blogsCount,
          sessions: sessionsCount,
          messages: messagesCount,
          subscribers: subscribersCount,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const cards = [
    {
      title: 'Products',
      count: stats.products,
      icon: FiPackage,
      link: '/admin/products',
      color: 'bg-purple-500',
    },
    {
      title: 'Blog Posts',
      count: stats.blogs,
      icon: FiEdit3,
      link: '/admin/blogs',
      color: 'bg-pink-500',
    },
    {
      title: 'Workshops',
      count: stats.sessions,
      icon: FiCalendar,
      link: '/admin/sessions',
      color: 'bg-blue-500',
    },
    {
      title: 'Messages',
      count: stats.messages,
      icon: FiMail,
      link: '/admin/messages',
      color: 'bg-yellow-500',
    },
    {
      title: 'Subscribers',
      count: stats.subscribers,
      icon: FiUserPlus,
      link: '/admin/subscribers',
      color: 'bg-indigo-500',
    },
    {
      title: 'Orders',
      count: null, // Optionally, you can fetch and display the order count
      icon: FiTruck,
      link: '/admin/orders',
      color: 'bg-orange-500',
    },
  ]

  const quickActions = [
    {
      title: 'Add New Product',
      link: '/admin/products/new',
      icon: FiPackage,
      color: 'bg-purple-500',
    },
    {
      title: 'Create Blog Post',
      link: '/admin/blogs/new',
      icon: FiEdit3,
      color: 'bg-pink-500',
    },
    {
      title: 'Schedule Session',
      link: '/admin/sessions/new',
      icon: FiCalendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Shipping',
      link: '/admin/shipping',
      icon: FiTruck,
      color: 'bg-green-500',
    },
    {
      title: 'Manage Promo Codes',
      link: '/admin/promo-codes',
      icon: FiTag,
      color: 'bg-yellow-500',
    },
    {
      title: 'Manage Orders',
      link: '/admin/orders',
      icon: FiTruck,
      color: 'bg-orange-500',
    },
    {
      title: 'Update Settings',
      link: '/admin/settings',
      icon: FiSettings,
      color: 'bg-gray-500',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-2">Admin Dashboard</h1>
          <Link to="/admin/settings" className="btn-secondary">
            <FiSettings className="w-5 h-5 mr-2" />
            Settings
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="block"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {card.title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {loading ? (
                        <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ) : (
                        card.count
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className={`${action.color} p-3 rounded-lg mr-4`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminDashboard
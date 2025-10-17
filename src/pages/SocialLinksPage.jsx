import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../contexts/SupabaseContext'
import { FiMail, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin, FiGithub, FiGlobe, FiLink, FiExternalLink } from 'react-icons/fi'
import Logo from '../components/common/Logo'

function SocialLinksPage() {
  const { supabase } = useSupabase()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const socialLinks = settings?.social_links || []

  const iconMap = {
    FiMail: FiMail,
    FiInstagram: FiInstagram,
    FiFacebook: FiFacebook,
    FiTwitter: FiTwitter,
    FiYoutube: FiYoutube,
    FiLinkedin: FiLinkedin,
    FiGithub: FiGithub,
    FiMapPin: FiMapPin,
    FiGlobe: FiGlobe,
    FiLink: FiLink
  }

  const colorMap = {
    FiMail: 'bg-red-500',
    FiInstagram: 'bg-pink-500',
    FiFacebook: 'bg-blue-500',
    FiTwitter: 'bg-sky-500',
    FiYoutube: 'bg-red-600',
    FiLinkedin: 'bg-blue-600',
    FiGithub: 'bg-gray-800',
    FiMapPin: 'bg-green-500',
    FiGlobe: 'bg-purple-500',
    FiLink: 'bg-gray-500'
  }

  // Handle both old object format and new array format
  let linkItems = []
  if (Array.isArray(socialLinks)) {
    linkItems = socialLinks.filter(link => link.title && link.url)
  } else {
    // Legacy support for old object format
    linkItems = Object.entries(socialLinks)
      .filter(([key, value]) => value)
      .map(([key, value]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        url: key === 'email' ? `mailto:${value}` : value,
        icon: key === 'email' ? 'FiMail' : 
              key === 'instagram' ? 'FiInstagram' :
              key === 'facebook' ? 'FiFacebook' :
              key === 'location' ? 'FiMapPin' : 'FiLink'
      }))
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
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
      className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">YasMade</h1>
            <p className="text-gray-600 dark:text-gray-400">Handmade Embroidery & Creative Sessions</p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {linkItems.map((item, index) => {
              const IconComponent = iconMap[item.icon] || FiLink
              const color = colorMap[item.icon] || 'bg-gray-500'
              const isEmail = item.url?.startsWith('mailto:')
              
              return (
                <motion.a
                  key={item.id || item.title}
                  href={item.url}
                  target={!isEmail ? '_blank' : undefined}
                  rel={!isEmail ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mr-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {isEmail ? item.url.replace('mailto:', '') : 
                         item.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </p>
                    </div>
                    <FiExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.a>
              )
            })}
            
            {linkItems.length === 0 && (
              <div className="text-center py-8">
                <FiLink className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-600 dark:text-gray-400">No social links available at the moment.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default SocialLinksPage
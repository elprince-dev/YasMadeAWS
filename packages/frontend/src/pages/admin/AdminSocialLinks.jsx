import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useToast } from '../../contexts/ToastContext'
import { FiSave, FiPlus, FiTrash2, FiLink, FiMail, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin, FiGithub, FiGlobe } from 'react-icons/fi'

function AdminSocialLinks() {
  const { supabase } = useSupabase()
  const { addToast } = useToast()
  const [socialLinks, setSocialLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const iconOptions = [
    { value: 'FiMail', label: 'Email', icon: FiMail },
    { value: 'FiInstagram', label: 'Instagram', icon: FiInstagram },
    { value: 'FiFacebook', label: 'Facebook', icon: FiFacebook },
    { value: 'FiTwitter', label: 'Twitter', icon: FiTwitter },
    { value: 'FiYoutube', label: 'YouTube', icon: FiYoutube },
    { value: 'FiLinkedin', label: 'LinkedIn', icon: FiLinkedin },
    { value: 'FiGithub', label: 'GitHub', icon: FiGithub },
    { value: 'FiMapPin', label: 'Location', icon: FiMapPin },
    { value: 'FiGlobe', label: 'Website', icon: FiGlobe },
    { value: 'FiLink', label: 'Other', icon: FiLink }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('social_links')
        .single()

      if (error) throw error
      
      // Convert old format to new array format if needed
      const links = data.social_links || {}
      if (Array.isArray(links)) {
        setSocialLinks(links)
      } else {
        // Migrate old object format to new array format
        const migratedLinks = Object.entries(links)
          .filter(([key, value]) => value)
          .map(([key, value], index) => ({
            id: Date.now() + index,
            title: key.charAt(0).toUpperCase() + key.slice(1),
            url: key === 'email' ? `mailto:${value}` : value,
            icon: key === 'email' ? 'FiMail' : 
                  key === 'instagram' ? 'FiInstagram' :
                  key === 'facebook' ? 'FiFacebook' :
                  key === 'location' ? 'FiMapPin' : 'FiLink'
          }))
        setSocialLinks(migratedLinks)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLink = () => {
    setSocialLinks(prev => [...prev, {
      id: Date.now(),
      title: '',
      url: '',
      icon: 'FiLink'
    }])
  }

  const updateLink = (id, field, value) => {
    setSocialLinks(prev => prev.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ))
  }

  const removeLink = (id) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('settings')
        .update({ social_links: socialLinks })
        .eq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      addToast('Social links updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating social links:', error)
      addToast('Failed to update social links', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
      className="min-h-screen py-12"
    >
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <h1 className="heading-2 mb-8">Manage Social Links</h1>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Social Links</h2>
                <button
                  type="button"
                  onClick={addLink}
                  className="btn-secondary flex items-center"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Link
                </button>
              </div>

              <div className="space-y-4">
                {socialLinks.map((link, index) => {
                  const IconComponent = iconOptions.find(opt => opt.value === link.icon)?.icon || FiLink
                  return (
                    <div key={link.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            placeholder="Link title"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            placeholder="https://example.com or mailto:email@domain.com"
                          />
                        </div>
                        
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Icon
                            </label>
                            <select
                              value={link.icon}
                              onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            >
                              {iconOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLink(link.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove link"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <IconComponent className="w-4 h-4 mr-2" />
                        Preview: {link.title || 'Untitled'}
                      </div>
                    </div>
                  )
                })}
                
                {socialLinks.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FiLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No social links added yet. Click "Add Link" to get started.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center"
            >
              <FiSave className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminSocialLinks
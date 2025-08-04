import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiInstagram, FiFacebook, FiMail } from 'react-icons/fi'
import { useSupabase } from '../../contexts/SupabaseContext'
import Logo from '../common/Logo'

function Footer() {
  const { supabase } = useSupabase()
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState(null)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)
  //---------------------
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      setSettings(data[0] || []);
    } catch (error) {
      console.error('Error fetching settings:', encodeURIComponent(error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }
  //----------------------
  
  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubscribing(true)
    setSubscribeError(null)
    setSubscribeSuccess(false)

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }])

      if (error) throw error

      setSubscribeSuccess(true)
      setEmail('')
    } catch (error) {
      console.error('Error subscribing:', encodeURIComponent(error.message || 'Unknown error'))
      setSubscribeError('Failed to subscribe. You might already be subscribed.')
    } finally {
      setSubscribing(false)
    }
  }

  
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 pt-12 pb-6 border-t border-gray-200 dark:border-gray-800">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <Logo className="h-16 w-auto" />
              <span className="ml-2 text-xl font-bold">YasMade</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Handmade embroidery, creative sessions, and artistic inspiration for your home and life.
            </p>
            <div className="flex space-x-4">
              <a
                href={settings?.social_links?.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram size={20} />
              </a>
              <a
                href={settings?.social_links?.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook size={20} />
              </a>
              <a
                href={`mailto:${settings?.social_links?.email}`}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Email"
              >
                <FiMail size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/sessions" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Sessions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  About YasMade
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Subscribe to updates</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Stay informed about new products, sessions, and blog posts.
            </p>
            <form onSubmit={handleSubscribe} className="mb-2">
              <div className="flex flex-col space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="btn-primary py-2"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {subscribeError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {subscribeError}
                </p>
              )}
              {subscribeSuccess && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Successfully subscribed!
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {currentYear} YasMade. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
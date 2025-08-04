import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiLogIn, FiShoppingCart } from 'react-icons/fi'
import Logo from '../common/Logo'
import { useCart } from '../../stores/cartStore'
import { preloadRoute } from '../../utils/performance'

function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, supabase } = useSupabase()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navLinks = [
    { name: 'Home', path: '/', preload: () => import('../../pages/HomePage') },
    { name: 'Products', path: '/products', preload: () => import('../../pages/ProductsPage') },
    { name: 'Blog', path: '/blog', preload: () => import('../../pages/BlogPage') },
    { name: 'Workshops', path: '/sessions', preload: () => import('../../pages/SessionsPage') },
    { name: 'Contact', path: '/contact', preload: () => import('../../pages/ContactPage') },
  ]

  const headerClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${
    scrolled 
      ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' 
      : 'bg-transparent'
      // : location.pathname === '/'
      //   ? 'bg-black/20 backdrop-blur-md'
      //   : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm'
  }`

  const getLinkClasses = (isActive) => `
    py-2 font-medium text-base transition-colors duration-300
    ${isActive 
      ? 'text-primary-600 dark:text-primary-400' 
      : scrolled
        ? 'text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
        : location.pathname === '/' && !scrolled
          ? 'text-white dark:text-gray-300 hover:text-primary-400 dark:hover:text-primary-400'
          : 'text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
    }
  `

  return (
    <header className={headerClasses}>
      <div className="container-custom flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <Logo className="h-12 w-auto" />
          <span className={`ml-2 text-xl font-bold ${
            scrolled || location.pathname !== '/'
              ? 'text-gray-900 dark:text-white'
              : 'text-white dark:text-white'
          }`}>
            YasMade
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => getLinkClasses(isActive)}
              onMouseEnter={() => link.preload && preloadRoute(link.preload)}
            >
              {link.name}
            </NavLink>
          ))}

          {/* Cart Link */}
          <Link
            to="/cart"
            className={`relative flex items-center ${getLinkClasses(false)}`}
          >
            <FiShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <button
                onClick={handleSignOut}
                className={`flex items-center ${getLinkClasses(false)}`}
              >
                <FiLogOut className="w-5 h-5 mr-1" />
                Sign Out
              </button>
            </>
          ) : null}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-300 ${
              scrolled || location.pathname !== '/'
                ? 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-white dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800'
            }`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
        </nav>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center">
          {/* Cart Link */}
          <Link
            to="/cart"
            className={`relative p-2 mr-2 ${getLinkClasses(false)}`}
          >
            <FiShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            className={`p-2 mr-2 rounded-full transition-colors duration-300 ${
              scrolled || location.pathname !== '/'
                ? 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-white dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800'
            }`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full transition-colors duration-300 ${
              scrolled || location.pathname !== '/'
                ? 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-white dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800'
            }`}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg md:hidden"
          >
            <nav className="flex flex-col py-4 px-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `py-3 font-medium text-base border-b border-gray-100 dark:border-gray-800 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </NavLink>
              ))}
              
              {user ? (
                <>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `py-3 font-medium text-base border-b border-gray-100 dark:border-gray-800 ${
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </NavLink>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center py-3 font-medium text-base text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <FiLogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center py-3 font-medium text-base text-gray-800 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiLogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  )
}

export default Header
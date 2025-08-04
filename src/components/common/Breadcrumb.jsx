import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiChevronRight, FiHome } from 'react-icons/fi'
import { useSupabase } from '../../contexts/SupabaseContext'

function Breadcrumb() {
  const location = useLocation()
  const { supabase } = useSupabase()
  const [dynamicNames, setDynamicNames] = useState({})
  const pathnames = location.pathname.split('/').filter(x => x)

  const breadcrumbNames = {
    products: 'Products',
    blog: 'Blog',
    sessions: 'Workshops',
    contact: 'Contact',
    about: 'About',
    cart: 'Shopping Cart'
  }

  useEffect(() => {
    async function fetchDynamicNames() {
      const names = {}
      
      for (let i = 0; i < pathnames.length; i++) {
        const segment = pathnames[i]
        const prevSegment = pathnames[i - 1]
        
        // Check if this is a product ID
        if (prevSegment === 'products' && !breadcrumbNames[segment]) {
          try {
            const { data } = await supabase
              .from('products')
              .select('name')
              .eq('id', segment)
              .single()
            if (data) names[segment] = data.name
          } catch (error) {
            console.error('Error fetching product name:', error)
          }
        }
        
        // Check if this is a blog post ID
        if (prevSegment === 'blog' && !breadcrumbNames[segment]) {
          try {
            const { data } = await supabase
              .from('blogs')
              .select('title')
              .eq('id', segment)
              .single()
            if (data) names[segment] = data.title
          } catch (error) {
            console.error('Error fetching blog post title:', error)
          }
        }
        
        // Check if this is a session ID
        if (prevSegment === 'sessions' && !breadcrumbNames[segment]) {
          try {
            const { data } = await supabase
              .from('sessions')
              .select('title')
              .eq('id', segment)
              .single()
            if (data) names[segment] = data.title
          } catch (error) {
            console.error('Error fetching session title:', error)
          }
        }
      }
      
      setDynamicNames(names)
    }

    if (pathnames.length > 0) {
      fetchDynamicNames()
    }
  }, [location.pathname, pathnames, supabase])

  if (location.pathname === '/') return null

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mt-20">
      <div className="container-custom py-3">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link 
              to="/" 
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <FiHome className="w-4 h-4" />
              <span className="ml-1">Home</span>
            </Link>
          </li>
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
            const isLast = index === pathnames.length - 1
            const displayName = dynamicNames[name] || breadcrumbNames[name] || name.charAt(0).toUpperCase() + name.slice(1)

            return (
              <li key={name} className="flex items-center">
                <FiChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-2" />
                {isLast ? (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {displayName}
                  </span>
                ) : (
                  <Link 
                    to={routeTo}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {displayName}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

export default Breadcrumb
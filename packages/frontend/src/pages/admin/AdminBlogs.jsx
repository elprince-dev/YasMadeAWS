import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSupabase } from '../../contexts/SupabaseContext'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch, FiFilter, FiX } from 'react-icons/fi'

function AdminBlogs() {
  const { supabase } = useSupabase()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all', // all, published, draft
    sortBy: 'newest' // newest, oldest, title
  })

  useEffect(() => {
    fetchBlogs()
  }, [])

  async function fetchBlogs() {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBlogs(data)
    } catch (error) {
      console.error('Error fetching blogs:', encodeURIComponent(error.message || 'Unknown error'))
      setError('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBlogs(blogs.filter(blog => blog.id !== id))
    } catch (error) {
      console.error('Error deleting blog:', encodeURIComponent(error.message || 'Unknown error'))
      alert('Failed to delete blog post')
    }
  }

  async function togglePublished(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ published: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setBlogs(blogs.map(blog => 
        blog.id === id ? { ...blog, published: !currentStatus } : blog
      ))
    } catch (error) {
      console.error('Error updating blog status:', encodeURIComponent(error.message || 'Unknown error'))
      alert('Failed to update blog status')
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setFilters({
      status: 'all',
      sortBy: 'newest'
    })
  }

  // Filter and sort blogs
  const filteredBlogs = blogs.filter(blog => {
    // Text search
    const searchMatch = 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const statusMatch = 
      filters.status === 'all' ||
      (filters.status === 'published' && blog.published) ||
      (filters.status === 'draft' && !blog.published)

    return searchMatch && statusMatch
  }).sort((a, b) => {
    // Sort blogs
    switch (filters.sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-2">Manage Blog Posts</h1>
          <Link to="/admin/blogs/new" className="btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            Create New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Posts</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>

              <button
                onClick={resetFilters}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <FiX className="w-4 h-4 mr-1" />
                Reset
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FiFilter className="w-4 h-4 mr-2" />
            <span>
              Showing {filteredBlogs.length} {filters.status !== 'all' ? filters.status : ''} posts
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {blog.image_url && (
                          <img
                            className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 dark:border-gray-600"
                            src={blog.image_url}
                            alt={blog.title}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {blog.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {blog.excerpt || blog.content.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        blog.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => togglePublished(blog.id, blog.published)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mr-4"
                        title={blog.published ? 'Unpublish' : 'Publish'}
                      >
                        {blog.published ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                      <Link
                        to={`/admin/blogs/${blog.id}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBlogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No blog posts found
                      {searchTerm && ' matching your search criteria'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminBlogs
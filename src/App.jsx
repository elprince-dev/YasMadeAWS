import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import SessionsPage from './pages/SessionsPage'
import SessionRegistrationPage from './pages/SessionRegistrationPage'
import SessionRegistrationSuccessPage from './pages/SessionRegistrationSuccessPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductEdit from './pages/admin/AdminProductEdit'
import AdminBlogs from './pages/admin/AdminBlogs'
import AdminBlogEdit from './pages/admin/AdminBlogEdit'
import AdminSessions from './pages/admin/AdminSessions'
import AdminSessionEdit from './pages/admin/AdminSessionEdit'
import AdminSettings from './pages/admin/AdminSettings'
import AdminRegistrations from './pages/admin/AdminRegistrations'
import AdminMessages from './pages/admin/AdminMessages'
import AdminSubscribers from './pages/admin/AdminSubscribers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminShippingRates from './pages/admin/AdminShippingRates'
import AdminPromoCodes from './pages/admin/AdminPromoCodes'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import ScrollToTop from './components/utils/ScrollToTop'

function App() {
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/register/:id" element={<SessionRegistrationPage />} />
            <Route path="/sessions/registration-success" element={<SessionRegistrationSuccessPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/products/new" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
            <Route path="/admin/products/:id" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
            <Route path="/admin/blogs" element={<ProtectedRoute><AdminBlogs /></ProtectedRoute>} />
            <Route path="/admin/blogs/new" element={<ProtectedRoute><AdminBlogEdit /></ProtectedRoute>} />
            <Route path="/admin/blogs/:id" element={<ProtectedRoute><AdminBlogEdit /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute><AdminSessions /></ProtectedRoute>} />
            <Route path="/admin/sessions/new" element={<ProtectedRoute><AdminSessionEdit /></ProtectedRoute>} />
            <Route path="/admin/sessions/:id" element={<ProtectedRoute><AdminSessionEdit /></ProtectedRoute>} />
            <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />
            <Route path="/admin/subscribers" element={<ProtectedRoute><AdminSubscribers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/shipping" element={<ProtectedRoute><AdminShippingRates /></ProtectedRoute>} />
            <Route path="/admin/promo-codes" element={<ProtectedRoute><AdminPromoCodes /></ProtectedRoute>} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

export default App
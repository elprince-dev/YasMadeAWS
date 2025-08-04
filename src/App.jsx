import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ScrollToTop from './components/utils/ScrollToTop'
import Breadcrumb from './components/common/Breadcrumb'
import PageLoader from './components/common/PageLoader'
import ErrorBoundary from './components/common/ErrorBoundary'
import SkipLink from './components/common/SkipLink'

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const SessionsPage = lazy(() => import('./pages/SessionsPage'))
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'))

function App() {
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <SkipLink />
        <ScrollToTop />
        <Header />
        <Breadcrumb />
        <main id="main-content" className="flex-grow">
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App
import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Lazy load admin components
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'))
const AdminProductEdit = lazy(() => import('../pages/admin/AdminProductEdit'))
const AdminBlogs = lazy(() => import('../pages/admin/AdminBlogs'))
const AdminBlogEdit = lazy(() => import('../pages/admin/AdminBlogEdit'))
const AdminSessions = lazy(() => import('../pages/admin/AdminSessions'))
const AdminSessionEdit = lazy(() => import('../pages/admin/AdminSessionEdit'))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'))
const AdminMessages = lazy(() => import('../pages/admin/AdminMessages'))
const AdminSubscribers = lazy(() => import('../pages/admin/AdminSubscribers'))
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'))
const AdminShippingRates = lazy(() => import('../pages/admin/AdminShippingRates'))
const AdminPromoCodes = lazy(() => import('../pages/admin/AdminPromoCodes'))

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
      <Route path="/blogs" element={<ProtectedRoute><AdminBlogs /></ProtectedRoute>} />
      <Route path="/blogs/new" element={<ProtectedRoute><AdminBlogEdit /></ProtectedRoute>} />
      <Route path="/blogs/:id" element={<ProtectedRoute><AdminBlogEdit /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><AdminSessions /></ProtectedRoute>} />
      <Route path="/sessions/new" element={<ProtectedRoute><AdminSessionEdit /></ProtectedRoute>} />
      <Route path="/sessions/:id" element={<ProtectedRoute><AdminSessionEdit /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />
      <Route path="/subscribers" element={<ProtectedRoute><AdminSubscribers /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
      <Route path="/shipping" element={<ProtectedRoute><AdminShippingRates /></ProtectedRoute>} />
      <Route path="/promo-codes" element={<ProtectedRoute><AdminPromoCodes /></ProtectedRoute>} />
    </Routes>
  )
}

export default AdminRoutes
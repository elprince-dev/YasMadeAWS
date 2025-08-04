import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'


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
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/products" element={<AdminProducts />} />
      <Route path="/products/new" element={<AdminProductEdit />} />
      <Route path="/products/:id" element={<AdminProductEdit />} />
      <Route path="/blogs" element={<AdminBlogs />} />
      <Route path="/blogs/new" element={<AdminBlogEdit />} />
      <Route path="/blogs/:id" element={<AdminBlogEdit />} />
      <Route path="/sessions" element={<AdminSessions />} />
      <Route path="/sessions/new" element={<AdminSessionEdit />} />
      <Route path="/sessions/:id" element={<AdminSessionEdit />} />
      <Route path="/messages" element={<AdminMessages />} />
      <Route path="/subscribers" element={<AdminSubscribers />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="/orders" element={<AdminOrders />} />
      <Route path="/shipping" element={<AdminShippingRates />} />
      <Route path="/promo-codes" element={<AdminPromoCodes />} />
    </Routes>
  )
}

export default AdminRoutes
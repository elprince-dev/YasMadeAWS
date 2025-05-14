import { Navigate } from 'react-router-dom'
import { useSupabase } from '../../contexts/SupabaseContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useSupabase()
  
  // If authentication is still loading, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // If user is not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }
  
  // If user is authenticated, render the protected content
  return children
}

export default ProtectedRoute
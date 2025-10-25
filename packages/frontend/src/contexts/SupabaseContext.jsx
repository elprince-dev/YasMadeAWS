import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate, useLocation } from 'react-router-dom'

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SupabaseContext = createContext()

export function SupabaseProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    async function getSession() {
      try {
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error.message)
          handleAuthChange('SIGNED_OUT', null)
          return
        }

        setSession(session)
        setUser(session?.user || null)
        setLoading(false)

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          handleAuthChange
        )

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        handleAuthChange('SIGNED_OUT', null)
      }
    }

    getSession()
  }, [navigate, location.pathname])

  const handleAuthChange = (event, session) => {
    setSession(session)
    setUser(session?.user || null)

    if (!session) {
      // If we're on an admin page and there's no session, redirect to login
      if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
        navigate('/admin/login', { replace: true })
      }
    }
  }

  const value = {
    user,
    session,
    supabase,
    loading,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
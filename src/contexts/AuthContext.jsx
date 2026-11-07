import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { getAdminProfile } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        const profile = await getAdminProfile()
        setAdmin(profile)
      } else {
        setAdmin(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (session) {
      getAdminProfile().then(p => {
        setAdmin(p)
        setLoading(false)
      })
    } else {
      setAdmin(null)
      setLoading(false)
    }
  }, [session])

  const isAuthenticated = !!session && !!admin

  return (
    <AuthContext.Provider value={{ session, admin, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


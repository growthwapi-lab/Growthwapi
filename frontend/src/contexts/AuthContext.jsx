import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Safety timeout: Ensure loading is set to false within 1s max even if offline
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 1000)

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return
        const session = data?.session || null
        setSession(session)
        setUser(session?.user ?? null)
      })
      .catch((err) => {
        console.warn('Supabase session check offline:', err.message)
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(timeout)
          setLoading(false)
        }
      })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    
    if (data?.user) {
      // Optional: If you handle insert via trigger in Supabase, you can skip this
      // Or you can insert to users table here
      const { error: dbError } = await supabase.from('users').upsert([{
        id: data.user.id,
        email: email,
        name: userData.full_name || userData.name || '',
        business_name: userData.business_name || '',
        phone: userData.phone || '',
        package_type: 'trial',
        account_status: 'trial',
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }], { onConflict: 'id' })
      
      if (dbError) {
        console.error('Error inserting user data', dbError)
      }
    }
    
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

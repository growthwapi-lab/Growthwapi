import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

api.interceptors.request.use(async (config) => {
  try {
    // Try to get current session
    let { data: { session } } = await supabase.auth.getSession()

    // If session exists but might be stale, force a refresh
    if (session) {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      // Refresh if token expires within 60 seconds
      if (expiresAt - now < 60) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed?.session) session = refreshed.session
      }
    }

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (e) {
    console.warn('api.js: session refresh warning:', e.message)
  }

  return config
})

// Auto sign-out on 401 — clears stale session and redirects to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

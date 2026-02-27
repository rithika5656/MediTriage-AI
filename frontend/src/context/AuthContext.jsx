/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

/**
 * Auth Provider Component
 * Wraps the application and provides authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Start as true!
  const [error, setError] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    }
    setLoading(false) // Always set loading to false after check!
  }, [])

  /**
   * Register new user
   */
  const signup = async (userData) => {
    try {
      setError(null)
      const response = await api.post('/auth/signup', userData)
      const { user, access_token } = response.data
      
      // Store token and user
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(user)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  /**
   * Login existing user
   */
  const login = async (email, password) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', { email, password })
      const { user, access_token } = response.data
      
      // Store token and user
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(user)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      setError(null)
      const response = await api.put('/auth/profile', profileData)
      const { user: updatedUser } = response.data
      
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.error || 'Update failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    updateProfile,
    clearError: () => setError(null)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

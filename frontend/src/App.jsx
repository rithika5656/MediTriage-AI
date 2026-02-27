/**
 * Main Application Component
 * Sets up routing and global providers
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ChatPage from './pages/ChatPage'
import AppointmentsPage from './pages/AppointmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import ProfilePage from './pages/ProfilePage'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

/**
 * Public Route Component
 * Redirects to chat if user is already authenticated
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/chat" replace />
  }
  
  return children
}

/**
 * Main App Component
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
          {/* Catch all - redirect to chat */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

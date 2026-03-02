/**
 * Main Application Component
 * Single Page Scrolling Unified Dashboard
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ChatPage from './pages/ChatPage'
import AppointmentsPage from './pages/AppointmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import ProfilePage from './pages/ProfilePage'
import HeatmapPage from './pages/HeatmapPage'
import ReportAnalyzerPage from './pages/ReportAnalyzerPage'
import FaceRecognitionPage from './pages/FaceRecognitionPage'
import FaceRegistrationPage from './pages/FaceRegistrationPage'
import FaceSeverityPage from './pages/FaceSeverityPage'

/**
 * Protected Route Component
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Initializing AI Hub...</p>
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
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * Section Header Component
 * Provides a high-contrast Mild White background divider
 */
const SectionHeader = ({ title, subtitle }) => (
  <div className="bg-[#f8fafc] py-16 mb-16 rounded-[40px] shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/10 transition-colors duration-700" />
    <div className="max-w-7xl mx-auto px-12 relative z-10 text-center md:text-left">
      <h2 className="text-4xl md:text-5xl font-black text-[#0a192f] mb-4 tracking-tighter">
        {title}
      </h2>
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-sm">
          {subtitle}
        </p>
        <div className="hidden md:block h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 text-cyan-600 font-black text-[10px] uppercase tracking-widest">
          <span className="w-8 h-1 bg-cyan-600 rounded-full" />
          Live System Monitoring
        </div>
      </div>
    </div>
  </div>
);

/**
 * Combined Dashboard Component
 * Stacks all modules vertically with IDs for smooth scrolling
 */
const SinglePageDashboard = () => {
  return (
    <Layout>
      <section id="chat" className="mb-32 scroll-mt-24">
        <ChatPage />
      </section>

      <section id="reports" className="mb-32 scroll-mt-24">
        <SectionHeader
          title="Report Analyzer"
          subtitle="AI-driven lab report analysis & risk extraction"
        />
        <ReportAnalyzerPage />
      </section>

      <section id="appointments" className="mb-32 scroll-mt-24">
        <SectionHeader
          title="Clinical Schedule"
          subtitle="Manage your upcoming medical consultations"
        />
        <AppointmentsPage />
      </section>

      <section id="doctors" className="mb-32 scroll-mt-24">
        <SectionHeader
          title="Medical Specialists"
          subtitle="Connect with certified healthcare professionals"
        />
        <DoctorsPage />
      </section>

      <section id="heatmap" className="mb-32 scroll-mt-24 shadow-2xl">
        <SectionHeader
          title="Outbreak Radar"
          subtitle="Real-time regional health monitoring and alerts"
        />
        <div className="h-[700px] rounded-[40px] overflow-hidden border border-gray-800">
          <HeatmapPage />
        </div>
      </section>

      <section id="profile" className="mb-32 scroll-mt-24">
        <SectionHeader
          title="Personal Health File"
          subtitle="Privacy-first medical history and account settings"
        />
        <ProfilePage />
      </section>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
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
            
            {/* Face Recognition (Public - for login) */}
            <Route path="/face-recognition" element={
              <FaceRecognitionPage />
            } />
            
            {/* Face Registration (Protected - requires auth) */}
            <Route path="/face-registration" element={
              <ProtectedRoute>
                <FaceRegistrationPage />
              </ProtectedRoute>
            } />
            
            {/* Face Severity Analysis (Protected - Visual Health Check) */}
            <Route path="/face-severity" element={
              <ProtectedRoute>
                <FaceSeverityPage />
              </ProtectedRoute>
            } />

            {/* Protected Main Unified Route */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SinglePageDashboard />
              </ProtectedRoute>
            } />

            {/* Compatibility Redirects */}
            <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
            <Route path="/appointments" element={<Navigate to="/dashboard" replace />} />
            <Route path="/doctors" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/dashboard" replace />} />

            {/* Root */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

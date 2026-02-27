/**
 * Login Page – Professional Navy Blue Theme
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

function LoginPage() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    clearError()
    setLocalError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields')
      return
    }
    setLoading(true)
    const result = await login(formData.email, formData.password)
    setLoading(false)
    if (result.success) navigate('/chat')
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #05101e 0%, #091528 35%, #0f213e 65%, #1b3a6b 100%)'
    }}>
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">MediTriage AI</span>
        </div>

        {/* Hero copy */}
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Your Smart<br />
            <span style={{
              background: 'linear-gradient(120deg, #4e8cff, #a8c4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Health Assistant</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(180,200,240,0.8)' }}>
            AI-powered symptom analysis, instant triage, and seamless appointment booking — all in one place.
          </p>

          <div className="space-y-4 pt-2">
            {[
              { icon: '🩺', title: 'Symptom Analysis', desc: 'Describe your symptoms in natural language' },
              { icon: '📅', title: 'Easy Booking', desc: 'Book specialist appointments instantly' },
              { icon: '🚨', title: 'Emergency Triage', desc: 'Smart risk assessment and alerts' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(160,190,230,0.7)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(130,160,210,0.5)' }}>
          © 2026 MediTriage AI. All rights reserved.
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">MediTriage AI</span>
            </div>
          </div>

          <div className="rounded-3xl p-8"
            style={{
              background: '#ffffff',
              boxShadow: '0 24px 80px rgba(5,16,30,0.55)',
            }}>
            <div className="mb-7">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
            </div>

            {displayError && (
              <div className="alert-error mb-5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input pl-10 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md
                               hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2"
              >
                {loading ? (
                  <>
                    <span className="spinner h-4 w-4 border-white" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: '#1b3a6b' }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

/**
 * Signup Page – Professional Navy Blue Theme
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Activity, Mail, Lock, Eye, EyeOff, AlertCircle,
  User, Phone, Calendar, ArrowRight, CheckCircle
} from 'lucide-react'

function SignupPage() {
  const { signup, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    age: '', gender: '', phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    clearError()
    setLocalError('')
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password ||
      !formData.age || !formData.gender || !formData.phone) {
      setLocalError('Please fill in all fields'); return false
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match'); return false
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters'); return false
    }
    if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      setLocalError('Please enter a valid age'); return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    const result = await signup({
      name: formData.name, email: formData.email, password: formData.password,
      age: parseInt(formData.age), gender: formData.gender, phone: formData.phone
    })
    setLoading(false)
    if (result.success) navigate('/chat')
  }

  const displayError = localError || error

  const perks = [
    'AI-powered symptom analysis',
    'Instant appointment booking',
    'Emergency triage alerts',
  ]

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #05101e 0%, #091528 35%, #0f213e 65%, #1b3a6b 100%)'
    }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">MediTriage AI</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Join thousands of<br />
              <span style={{
                background: 'linear-gradient(120deg, #4e8cff, #a8c4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>healthier patients</span>
            </h1>
            <p style={{ color: 'rgba(180,200,240,0.8)', lineHeight: 1.7 }}>
              Get AI-powered health guidance, smart triage, and seamless care coordination.
            </p>
          </div>

          <div className="space-y-3">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(78,140,255,0.2)', border: '1px solid rgba(78,140,255,0.3)' }}>
                  <CheckCircle className="h-3.5 w-3.5" style={{ color: '#4e8cff' }} />
                </span>
                <span className="text-sm" style={{ color: 'rgba(200,220,255,0.85)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(130,160,210,0.5)' }}>
          © 2026 MediTriage AI. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">MediTriage AI</span>
            </div>
          </div>

          <div className="rounded-3xl p-8"
            style={{ background: '#fff', boxShadow: '0 24px 80px rgba(5,16,30,0.55)' }}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create account</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign up to get started</p>
            </div>

            {displayError && (
              <div className="alert-error mb-5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="John Doe" className="input pl-10" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="you@example.com" className="input pl-10" />
                </div>
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <input type="number" name="age" value={formData.age} onChange={handleChange}
                      placeholder="25" min="1" max="120" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="input">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+91 9876543210" className="input pl-10" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Min. 6 characters" className="input pl-10 pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" className="input pl-10" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? (
                  <><span className="spinner h-4 w-4 border-white" /><span>Creating account…</span></>
                ) : (
                  <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#1b3a6b' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage

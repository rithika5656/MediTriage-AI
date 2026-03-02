import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Activity, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ScanFace,
  Siren, Phone, MapPin, AlertTriangle, CheckCircle, Loader2, X
} from 'lucide-react'

function LoginPage() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  // Emergency state
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState('')
  const [emergencyResult, setEmergencyResult] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [locationStatus, setLocationStatus] = useState('idle') // 'idle' | 'getting' | 'success' | 'error'
  const [currentLocation, setCurrentLocation] = useState(null)

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
    if (result.success) navigate('/dashboard')
  }

  // Emergency functions
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+?\d{10,15})$/.test(cleaned)
  }

  const getCurrentLocation = () => {
    setLocationStatus('getting')
    setEmergencyError('')
    
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setEmergencyError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationStatus('success')
      },
      (error) => {
        setLocationStatus('error')
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setEmergencyError('Location permission denied. Please enable location access.')
            break
          case error.POSITION_UNAVAILABLE:
            setEmergencyError('Location unavailable. Please try again.')
            break
          case error.TIMEOUT:
            setEmergencyError('Location request timed out. Please try again.')
            break
          default:
            setEmergencyError('Failed to get location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleEmergencyRequest = () => {
    setEmergencyError('')
    
    if (!emergencyPhone) {
      setEmergencyError('Please enter your phone number')
      return
    }
    
    if (!validatePhoneNumber(emergencyPhone)) {
      setEmergencyError('Please enter a valid phone number (10-15 digits)')
      return
    }
    
    if (!currentLocation) {
      setEmergencyError('Please get your current location first')
      return
    }
    
    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const confirmEmergencyDispatch = async () => {
    setShowConfirmation(false)
    setEmergencyLoading(true)
    setEmergencyError('')
    
    try {
      const response = await fetch('/api/emergency-direct-request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: emergencyPhone,
          location: currentLocation
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmergencyResult(data)
      } else {
        setEmergencyError(data.error || 'Failed to dispatch ambulance')
      }
    } catch (err) {
      console.error('Emergency request error:', err)
      setEmergencyError('Network error. Please call emergency services directly: 108')
    } finally {
      setEmergencyLoading(false)
    }
  }

  const resetEmergency = () => {
    setEmergencyPhone('')
    setEmergencyResult(null)
    setEmergencyError('')
    setCurrentLocation(null)
    setLocationStatus('idle')
    setShowConfirmation(false)
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

            {/* Face Recognition Login Option */}
            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white" style={{ color: 'var(--text-muted)' }}>or</span>
                </div>
              </div>
              
              <Link
                to="/face-recognition"
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all group"
              >
                <ScanFace className="h-5 w-5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                <span className="font-semibold text-gray-600 group-hover:text-cyan-600 transition-colors">Login with Face Recognition</span>
              </Link>
            </div>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: '#1b3a6b' }}>
                Create one
              </Link>
            </p>
          </div>

          {/* Emergency Ambulance Section */}
          <div className="mt-6 rounded-2xl p-6 border-2 border-red-500/50 bg-red-50/90"
               style={{ boxShadow: '0 4px 20px rgba(220, 38, 38, 0.15)' }}>
            
            {/* Confirmation Modal */}
            {showConfirmation && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Confirm Emergency Dispatch</h3>
                      <p className="text-sm text-gray-500">This will dispatch an ambulance to your location</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ Use this only in real medical emergencies. False requests may delay help for others in need.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                    <p className="text-gray-600"><strong>Phone:</strong> {emergencyPhone}</p>
                    <p className="text-gray-600"><strong>Location:</strong> {currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)}</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmEmergencyDispatch}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Siren className="h-4 w-4" />
                      Confirm Dispatch
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!emergencyResult ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                    <Siren className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 text-lg">Emergency Help</h3>
                    <p className="text-xs text-red-600">No login required</p>
                  </div>
                </div>
                
                <p className="text-sm text-red-700 mb-4">
                  If you are in a medical emergency, request ambulance immediately.
                </p>

                {/* Error display */}
                {emergencyError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{emergencyError}</span>
                  </div>
                )}

                {/* Phone Input */}
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-red-800 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-red-200 bg-white text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Location Button */}
                <button
                  onClick={getCurrentLocation}
                  disabled={locationStatus === 'getting'}
                  className={`w-full mb-3 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    locationStatus === 'success'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : locationStatus === 'getting'
                      ? 'bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-wait'
                      : 'bg-white text-red-700 border-2 border-red-300 hover:bg-red-50'
                  }`}
                >
                  {locationStatus === 'getting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : locationStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Location Obtained
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      Use Current Location
                    </>
                  )}
                </button>

                {/* Location coordinates display */}
                {currentLocation && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                    📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </div>
                )}

                {/* Request Button */}
                <button
                  onClick={handleEmergencyRequest}
                  disabled={emergencyLoading || !emergencyPhone || !currentLocation}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    emergencyLoading || !emergencyPhone || !currentLocation
                      ? 'bg-red-300 text-red-100 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-300'
                  }`}
                >
                  {emergencyLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Siren className="h-5 w-5" />
                      Request Ambulance
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs text-center text-red-500">
                  ⚠️ Demo simulation only. In real emergencies, call <strong>108</strong> or <strong>112</strong>.
                </p>
              </>
            ) : (
              /* Success Result */
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                  <Siren className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  🚑 Ambulance Dispatched
                </h3>
                
                <div className="bg-white rounded-xl p-4 mb-4 text-left border border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Request ID:</span>
                      <span className="font-bold text-gray-800">{emergencyResult.request_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">ETA:</span>
                      <span className="font-bold text-green-700">{emergencyResult.estimated_arrival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Hospital:</span>
                      <span className="font-bold text-gray-800">{emergencyResult.nearest_hospital}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{emergencyResult.hospital_address}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-green-700 mb-4">
                  {emergencyResult.message}
                </p>
                
                <button
                  onClick={resetEmergency}
                  className="py-2 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

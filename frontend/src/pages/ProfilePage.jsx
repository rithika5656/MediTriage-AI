/**
 * Profile Page – Professional Navy Blue Theme
 */
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  User, Mail, Phone, Calendar, Save,
  AlertCircle, CheckCircle, Loader2, Shield, Edit3
} from 'lucide-react'

function ProfilePage() {
  const { user, updateProfile } = useAuth()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    phone: user?.phone || ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone
      })
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto" style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>

      {/* ── Profile Banner ── */}
      <div className="rounded-3xl overflow-hidden mb-6"
        style={{ boxShadow: '0 8px 30px rgba(15,33,62,0.18)' }}>
        {/* Banner top */}
        <div className="relative px-8 pt-10 pb-20 profile-banner"
          style={{ background: 'linear-gradient(135deg, #05101e 0%, #0f213e 40%, #1b3a6b 80%, #3d68b4 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #4e8cff, transparent)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a8c4ff, transparent)', transform: 'translate(-20%,30%)' }} />

          <div className="relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-3xl mb-4 ring-4"
              style={{
                background: 'linear-gradient(135deg, #4e8cff 0%, #1b3a6b 100%)',
                ringColor: 'rgba(255,255,255,0.2)'
              }}>
              {initials}
            </div>
            <h2 className="text-2xl font-extrabold text-white">{user?.name}</h2>
            <p className="text-sm mt-1 flex items-center gap-2" style={{ color: 'rgba(180,210,255,0.8)' }}>
              <Mail className="h-4 w-4" /> {user?.email}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 bg-white divide-x" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Account ID', value: `#${user?.id || '—'}` },
            { label: 'Age', value: user?.age ? `${user.age} yrs` : '—' },
            {
              label: 'Member since', value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '—'
            },
          ].map(stat => (
            <div key={stat.label} className="py-4 px-6 text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Form Card ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
            <Edit3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Update your personal information</p>
          </div>
        </div>

        {message.text && (
          <div className={`${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-5`}>
            {message.type === 'success'
              ? <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            }
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input pl-10" />
            </div>
          </div>

          {/* Email – readonly */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input pl-10 cursor-not-allowed"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Email address cannot be changed</p>
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Age</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number" name="age" value={formData.age} onChange={handleChange}
                  min="1" max="120" className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input pl-10" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-4 w-4" />Save Changes</>
            )}
          </button>
        </form>
      </div>

      {/* ── Security Card ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Account Security</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your account is protected</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Account ID', value: `#${user?.id}` },
            { label: 'Email Verified', value: 'Yes ✓' },
            {
              label: 'Member Since', value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'N/A'
            },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2.5 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

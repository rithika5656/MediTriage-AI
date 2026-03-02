import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { checkFaceRegistration } from '../services/faceService'
import {
  User, Mail, Phone, Calendar, Save,
  AlertCircle, CheckCircle, Loader2, Shield, Edit3, ScanFace
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
  const [hasFaceRegistered, setHasFaceRegistered] = useState(null)

  // Check face registration status
  useEffect(() => {
    const checkFace = async () => {
      try {
        const result = await checkFaceRegistration()
        setHasFaceRegistered(result.has_face_registered)
      } catch {
        setHasFaceRegistered(false)
      }
    }
    checkFace()
  }, [])

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

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-transparent">

      {/* ── Profile Banner ── */}
      <div className="rounded-[40px] overflow-hidden border border-gray-800 bg-[#0a192f] shadow-2xl relative">
        {/* Banner Gradient */}
        <div className="h-48 bg-gradient-to-r from-cyan-900/40 via-blue-900/20 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="px-10 pb-10">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 relative z-10 mb-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-3xl bg-[#111827] border-4 border-[#0a192f] flex items-center justify-center text-white font-black text-4xl shadow-2xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500">
                {initials}
              </span>
            </div>
            <div className="flex-1 mb-2">
              <h1 className="text-3xl font-black text-white tracking-tight">{user?.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm font-bold text-cyan-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {user?.email}
                </p>
                <span className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> Verified Member
                </p>
              </div>
            </div>
            <div className="mb-2">
              <button className="px-6 py-3 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-cyan-500/20">
                Active Account
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-[#111827]/50 rounded-[32px] p-2 border border-white/5">
            {[
              { label: 'Patient ID', value: `#${user?.id || '—'}` },
              { label: 'Calculated Age', value: user?.age ? `${user.age} Yrs` : '—' },
              { label: 'Primary Gender', value: user?.gender || 'N/A' },
              { label: 'Enrolled Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '—' },
            ].map(stat => (
              <div key={stat.label} className="py-6 px-4 text-center group hover:bg-white/5 rounded-[28px] transition-all">
                <p className="text-base font-black text-white mb-1">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111827] border border-gray-800 rounded-[32px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-900 flex items-center justify-center">
                  <Edit3 className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">System Identity</h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Global Patient Records</p>
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`mb-8 p-4 rounded-2xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
                {message.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                <span className="text-sm font-bold">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#0a1322] border border-gray-800 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email Index</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700" />
                    <input type="email" value={user?.email || ''} disabled className="w-full bg-[#1e293b]/30 border border-gray-800 text-slate-600 rounded-2xl py-3.5 pl-12 pr-4 cursor-not-allowed font-medium text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Age Group</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-[#0a1322] border border-gray-800 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Gender Entry</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#0a1322] border border-gray-800 text-white rounded-2xl py-3.5 px-4 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-sm">
                    <option value="">Choose...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Comm. Channel (Phone)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#0a1322] border border-gray-800 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-sm" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-cyan-900/40 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Synchronizing...</> : <><Save className="h-4 w-4" /> Commit Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#111827] to-[#0a192f] border border-gray-800 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/30 border border-emerald-900 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white tracking-tight">Security Vault</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Auth Status', value: 'Double Encrypted' },
                { label: 'HIPAA Port', value: 'Tunnel Active' },
                { label: 'Last Sync', value: 'Just Now' }
              ].map(item => (
                <div key={item.label} className="flex flex-col p-4 bg-black/20 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.label}</span>
                  <span className="text-xs font-bold text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-[32px] p-8 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Account Integrity</p>
            <div className="w-20 h-20 rounded-full border-4 border-cyan-900 flex items-center justify-center mx-auto mb-4 relative">
              <span className="text-xl font-black text-white">100</span>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow" />
            </div>
            <p className="text-xs font-bold text-slate-400">Your profile score is perfect. <br /> Records are up to date.</p>
          </div>

          {/* Face Recognition Card */}
          <div className="bg-gradient-to-br from-[#111827] to-[#0a192f] border border-gray-800 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                hasFaceRegistered 
                  ? 'bg-emerald-950/30 border border-emerald-900' 
                  : 'bg-cyan-950/30 border border-cyan-900'
              }`}>
                <ScanFace className={`h-5 w-5 ${
                  hasFaceRegistered ? 'text-emerald-400' : 'text-cyan-400'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight">Face Login</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                  {hasFaceRegistered === null ? 'Loading...' : hasFaceRegistered ? 'Active' : 'Not Set Up'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {hasFaceRegistered ? (
                <>
                  <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-bold">Face Recognition Active</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">You can log in using your face</p>
                  </div>
                  <Link
                    to="/face-registration"
                    className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-center font-bold rounded-xl transition-all text-xs uppercase tracking-wider"
                  >
                    Manage Face Login
                  </Link>
                </>
              ) : (
                <>
                  <div className="p-4 bg-cyan-950/30 rounded-2xl border border-cyan-900/30">
                    <p className="text-xs text-slate-400">Set up face login for quick and secure access without passwords.</p>
                  </div>
                  <Link
                    to="/face-registration"
                    className="block w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-center font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <ScanFace className="h-4 w-4" />
                    Set Up Face Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

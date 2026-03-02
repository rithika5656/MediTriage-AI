import { useState, useEffect } from 'react'
import appointmentService from '../services/appointmentService'
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter,
  ArrowRight,
  MoreVertical,
  CalendarDays
} from 'lucide-react'

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentService.getAppointments()
      setAppointments(data.appointments)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true
    return apt.status.toLowerCase() === filter.toLowerCase()
  })

  return (
    <div className="bg-transparent">

      {/* ── Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 flex items-center justify-center border border-cyan-500/30">
              <CalendarDays className="h-5 w-5 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Appointments</h1>
          </div>
          <p className="text-sm text-slate-400 pl-[52px]">Manage and track your upcoming medical consultations</p>
        </div>

        <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-xl border border-gray-800">
          {['all', 'confirmed', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Retrieving your schedule...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-[#111827] border-2 border-dashed border-gray-800 rounded-[32px] p-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No appointments found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">You haven't scheduled any consultations yet. Browse our specialists to get started.</p>
          <button className="px-6 py-3 bg-[#1e293b] hover:bg-[#334155] text-white rounded-xl font-bold transition-all border border-gray-700">
            Book First Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-[#111827] border border-gray-800 rounded-3xl p-6 group hover:border-cyan-500/30 transition-all hover:shadow-2xl hover:shadow-cyan-900/10"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1e293b] border border-gray-700 flex items-center justify-center text-white font-black text-lg">
                    {apt.doctor_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold group-hover:text-cyan-400 transition-colors">{apt.doctor_name}</h3>
                    <p className="text-[10px] text-cyan-500 uppercase font-black tracking-widest mt-1">Specialist</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${apt.status.toLowerCase() === 'confirmed'
                    ? 'bg-emerald-950/30 border-emerald-900 text-emerald-500'
                    : 'bg-amber-950/30 border-amber-900 text-amber-500'
                  }`}>
                  {apt.status}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="font-medium">{new Date(apt.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="font-medium">{new Date(apt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {apt.symptoms_summary && (
                <div className="mb-8 p-4 bg-[#0a1322] rounded-2xl border border-gray-800">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" /> Reported Symptoms
                  </p>
                  <p className="text-xs text-slate-300 italic">"{apt.symptoms_summary}"</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button className="flex-1 py-3 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-cyan-500/20">
                  Manage
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e293b] border border-gray-800 text-slate-500 hover:text-white hover:border-gray-700 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage

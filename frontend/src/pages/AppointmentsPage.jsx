/**
 * Appointments Page – Professional Navy Blue Theme
 */
import { useState, useEffect } from 'react'
import appointmentService from '../services/appointmentService'
import {
  Calendar, Clock, User, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, Loader2, CalendarDays
} from 'lucide-react'

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => { loadAppointments() }, [filter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter !== 'all') params.status = filter
      const response = await appointmentService.getAppointments(params)
      setAppointments(response.appointments)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    try {
      setCancellingId(id)
      await appointmentService.cancelAppointment(id)
      loadAppointments()
    } catch (error) {
      alert('Failed to cancel appointment. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const statusConfig = {
    pending: { label: 'Pending', bg: '#fffbeb', border: '#fcd34d', text: '#92400e', dot: '#f59e0b', Icon: Clock },
    confirmed: { label: 'Confirmed', bg: '#f0fdf4', border: '#86efac', text: '#14532d', dot: '#22c55e', Icon: CheckCircle },
    completed: { label: 'Completed', bg: '#eef1f8', border: '#b0bee0', text: '#1b3a6b', dot: '#4e72bd', Icon: CheckCircle },
    cancelled: { label: 'Cancelled', bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', dot: '#9ca3af', Icon: XCircle },
  }

  const getStatusBadge = (status) => {
    const cfg = statusConfig[status] || statusConfig.pending
    const Icon = cfg.Icon
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    if (priority === 'emergency') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
        <AlertTriangle className="h-3 w-3" /> Emergency
      </span>
    )
    if (priority === 'high') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        High Priority
      </span>
    )
    return null
  }

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
  const formatTime = (ds) => new Date(ds).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })

  const getBorderColor = (appt) => {
    if (appt.priority_flag === 'emergency') return '#ef4444'
    if (appt.status === 'confirmed') return '#22c55e'
    if (appt.status === 'completed') return '#4e72bd'
    if (appt.status === 'cancelled') return '#d1d5db'
    return '#1b3a6b'
  }

  const filterOptions = [
    { value: 'all', label: 'All Appointments' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="p-4 md:p-8" style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Appointments</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', paddingLeft: '52px' }}>
          View and manage your scheduled appointments
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={filter === opt.value ? {
              background: 'linear-gradient(135deg, #0f213e, #1b3a6b)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(27,58,107,0.3)'
            } : {
              background: '#fff',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: '#1b3a6b' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading appointments…</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>No appointments found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all' ? "You haven't booked any appointments yet" : `No ${filter} appointments`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-card-hover"
              style={{
                boxShadow: '0 2px 12px rgba(15,33,62,0.07)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${getBorderColor(appt)}`
              }}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                  {/* Doctor info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
                      {appt.doctor_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'Dr'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{appt.doctor_name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{appt.doctor_specialization}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getStatusBadge(appt.status)}
                        {getPriorityBadge(appt.priority_flag)}
                      </div>
                    </div>
                  </div>

                  {/* Date / time */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm justify-end" style={{ color: 'var(--text-primary)' }}>
                      <Calendar className="h-4 w-4" style={{ color: '#1b3a6b' }} />
                      <span className="font-semibold">{formatDate(appt.time_slot)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm justify-end mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      <span>{formatTime(appt.time_slot)}</span>
                    </div>
                  </div>
                </div>

                {appt.symptoms_summary && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Symptoms: </span>
                      {appt.symptoms_summary}
                    </p>
                  </div>
                )}

                {appt.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancellingId === appt.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                                 text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                    >
                      {cancellingId === appt.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Cancelling…</>
                      ) : (
                        <><XCircle className="h-4 w-4" />Cancel Appointment</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage

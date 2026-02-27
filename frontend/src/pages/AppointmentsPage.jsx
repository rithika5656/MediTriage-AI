/**
 * Appointments Page Component
 * Displays user's appointments and allows management
 */
import { useState, useEffect } from 'react'
import appointmentService from '../services/appointmentService'
import { 
  Calendar, Clock, User, AlertTriangle, 
  CheckCircle, XCircle, ChevronDown, Loader2
} from 'lucide-react'

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    loadAppointments()
  }, [filter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter !== 'all') {
        params.status = filter
      }
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
      console.error('Failed to cancel appointment:', error)
      alert('Failed to cancel appointment. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    if (priority === 'emergency') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3" />
          Emergency
        </span>
      )
    }
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          High Priority
        </span>
      )
    }
    return null
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
        <p className="text-gray-600 mt-1">View and manage your scheduled appointments</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by status:</label>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No appointments found</h3>
          <p className="text-gray-500 mt-1">
            {filter === 'all' 
              ? "You haven't booked any appointments yet"
              : `No ${filter} appointments`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`bg-white rounded-xl shadow-sm p-4 md:p-6 border-l-4 ${
                appointment.priority_flag === 'emergency' 
                  ? 'border-red-500' 
                  : appointment.status === 'confirmed'
                    ? 'border-green-500'
                    : 'border-primary-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Doctor Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{appointment.doctor_name}</h3>
                    <p className="text-sm text-gray-500">{appointment.doctor_specialization}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {getStatusBadge(appointment.status)}
                      {getPriorityBadge(appointment.priority_flag)}
                    </div>
                  </div>
                </div>

                {/* Date/Time */}
                <div className="text-left md:text-right">
                  <div className="flex items-center gap-2 text-gray-800">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatDate(appointment.time_slot)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatTime(appointment.time_slot)}</span>
                  </div>
                </div>
              </div>

              {/* Symptoms Summary */}
              {appointment.symptoms_summary && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Symptoms:</span> {appointment.symptoms_summary}
                  </p>
                </div>
              )}

              {/* Actions */}
              {appointment.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    disabled={cancellingId === appointment.id}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    {cancellingId === appointment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Cancel Appointment
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage

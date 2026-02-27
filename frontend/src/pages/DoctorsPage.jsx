/**
 * Doctors Page – Professional Navy Blue Theme
 */
import { useState, useEffect } from 'react'
import doctorService from '../services/doctorService'
import appointmentService from '../services/appointmentService'
import {
  Search, Star, Calendar, Clock, User, X,
  ChevronDown, Loader2, CheckCircle, AlertCircle, Stethoscope
} from 'lucide-react'

function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')

  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [symptoms, setSymptoms] = useState('')

  useEffect(() => {
    loadDoctors()
    loadSpecializations()
  }, [selectedSpec])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedSpec) params.specialization = selectedSpec
      const response = await doctorService.getDoctors(params)
      setDoctors(response.doctors)
    } catch (error) {
      console.error('Failed to load doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSpecializations = async () => {
    try {
      const response = await doctorService.getSpecializations()
      setSpecializations(response.specializations)
    } catch (error) {
      console.error('Failed to load specializations:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadDoctors(); return }
    try {
      setLoading(true)
      const response = await doctorService.searchDoctors(searchQuery)
      setDoctors(response.doctors)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openBookingModal = async (doctor) => {
    setSelectedDoctor(doctor)
    setSelectedSlot(null)
    setBookingResult(null)
    setSlotsLoading(true)
    try {
      const response = await doctorService.getSlots(doctor.id)
      setSlots(response.available_slots)
    } catch (error) {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const closeBookingModal = () => {
    setSelectedDoctor(null)
    setSlots([])
    setSelectedSlot(null)
    setBookingResult(null)
    setSymptoms('')
  }

  const handleBooking = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      const result = await appointmentService.bookAppointment({
        doctor_id: selectedDoctor.id,
        time_slot: selectedSlot.datetime,
        symptoms_summary: symptoms || undefined
      })
      setBookingResult({ success: true, message: result.message })
      const response = await doctorService.getSlots(selectedDoctor.id)
      setSlots(response.available_slots)
      setSelectedSlot(null)
    } catch (error) {
      setBookingResult({
        success: false,
        message: error.response?.data?.error || 'Booking failed. Please try again.'
      })
    } finally {
      setBooking(false)
    }
  }

  const getSpecColor = (spec) => {
    const colors = [
      '#1b3a6b', '#0f7490', '#065f46', '#7c3aed', '#b45309',
      '#9f1239', '#1e40af', '#166534', '#92400e', '#6b21a8'
    ]
    let hash = 0
    for (let c of (spec || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="p-4 md:p-8" style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Find a Doctor</h1>
        </div>
        <p className="text-sm ml-13 pl-13" style={{ color: 'var(--text-secondary)', paddingLeft: '52px' }}>
          Browse our specialists and book an appointment
        </p>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or specialization…"
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="input appearance-none pr-9 min-w-[220px]"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* ── Doctors Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#1b3a6b' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading doctors…</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="card text-center py-16">
          <User className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>No doctors found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card group">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${getSpecColor(doctor.specialization)}, #4e8cff33)` }}>
                  {doctor.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doctor.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${getSpecColor(doctor.specialization)}18`,
                      color: getSpecColor(doctor.specialization)
                    }}>
                    {doctor.specialization}
                  </span>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{doctor.qualification}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{doctor.rating}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#e8edf5', color: 'var(--text-secondary)' }}>
                    {doctor.experience_years} yrs exp.
                  </span>
                </div>
              </div>

              <button
                id={`book-doctor-${doctor.id}`}
                onClick={() => openBookingModal(doctor)}
                className="btn-primary w-full mt-5 py-2.5"
              >
                <Calendar className="h-4 w-4" />
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Booking Modal ── */}
      {selectedDoctor && (
        <div className="modal-backdrop animate-scale-in">
          <div className="modal-card animate-scale-in">

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold text-white">Book Appointment</h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(180,205,240,0.8)' }}>{selectedDoctor.name}</p>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-2 rounded-xl transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto scrollbar-thin" style={{ maxHeight: '55vh' }}>

              {bookingResult && (
                <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${bookingResult.success ? 'alert-success' : 'alert-error'
                  }`}>
                  {bookingResult.success
                    ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-sm">{bookingResult.message}</p>
                </div>
              )}

              {/* Symptoms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Describe your symptoms <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Brief description of your health concern…"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Slots */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Select a time slot
                </h3>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#1b3a6b' }} />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No available slots</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-btn ${selectedSlot?.datetime === slot.datetime ? 'selected' : ''}`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          <Calendar className="h-3.5 w-3.5" style={{ color: '#1b3a6b' }} />
                          {slot.day}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{slot.date}</div>
                        <div className="flex items-center gap-1 text-xs mt-1 font-medium" style={{ color: '#1b3a6b' }}>
                          <Clock className="h-3 w-3" />
                          {slot.time}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button onClick={closeBookingModal} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleBooking}
                disabled={!selectedSlot || booking}
                className="btn-primary flex-1"
              >
                {booking ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Booking…</>
                ) : (
                  <><CheckCircle className="h-4 w-4" />Confirm Booking</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorsPage

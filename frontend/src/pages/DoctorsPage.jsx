import { useState, useEffect } from 'react'
import doctorService from '../services/doctorService'
import appointmentService from '../services/appointmentService'
import {
  Search, Star, Calendar, Clock, User, X,
  ChevronDown, Loader2, CheckCircle, AlertCircle, Stethoscope, MapPin
} from 'lucide-react'

function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [cities, setCities] = useState([])

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [symptoms, setSymptoms] = useState('')

  useEffect(() => {
    loadSpecializationsAndCities()
  }, [])

  useEffect(() => {
    loadDoctors()
  }, [selectedSpec, selectedCity])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedSpec) params.specialization = selectedSpec
      if (selectedCity) params.city = selectedCity
      const response = await doctorService.getDoctors(params)
      setDoctors(response.doctors)
    } catch (error) {
      console.error('Failed to load doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSpecializationsAndCities = async () => {
    try {
      const specResponse = await doctorService.getSpecializations()
      setSpecializations(specResponse.specializations.sort())

      const cityResponse = await doctorService.getCities()
      setCities(cityResponse.cities.sort())
    } catch (error) {
      console.error('Failed to load filters:', error)
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

  // Generate deterministic avatars from names
  const getAvatarColor = (name) => {
    const colors = ['#0891b2', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];
    let hash = 0;
    for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="bg-transparent py-4 text-slate-50">

      {/* ── Search & Filter Panel ── */}
      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 mb-10 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="md:col-span-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search specific doctors..."
              className="w-full bg-[#0a1322] border border-[#1e293b] text-white placeholder-slate-500 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#0a1322] border border-[#1e293b] text-white rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium text-sm"
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Regions</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
          </div>

          <div className="relative">
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="w-full bg-[#0a1322] border border-[#1e293b] text-white rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium text-sm truncate"
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec} className="truncate">{spec}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
          </div>

        </div>
      </div>

      {/* ── Doctors Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-cyan-500" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Compiling Directory...</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-[32px] text-center py-20">
          <User className="h-14 w-14 mx-auto mb-4 text-slate-600" />
          <h3 className="font-bold text-xl text-white mb-2">No profiles matched your search</h3>
          <p className="text-sm text-slate-400">Try broadening your area or clearing your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-[#111827] border border-gray-800 rounded-3xl p-6 flex flex-col group hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-900/20 transition-all duration-300 relative h-full">

              <div className="flex items-start gap-4 mb-5">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-black text-xl border border-white/5 shadow-inner"
                  style={{ background: `linear-gradient(135deg, ${getAvatarColor(doctor.name)}, #0a192f)` }}
                >
                  {doctor.name ? doctor.name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('') : 'DR'}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-[#f8fafc] text-sm truncate mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{doctor.name}</h3>
                  <p className="text-[#22d3ee] font-black text-[10px] uppercase tracking-widest truncate">{doctor.specialization}</p>
                </div>
              </div>

              {/* Badges / Experience */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="bg-[#0a1322] border border-gray-800 p-1.5 rounded-lg shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-xs font-medium truncate">{doctor.hospital} <span className="text-slate-600 ml-1">• {doctor.city}</span></p>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="bg-[#0a1322] border border-gray-800 p-1.5 rounded-lg shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-[11px] truncate flex-[2]">{doctor.qualification}</p>
                </div>
              </div>

              {/* Bottom Info & Button */}
              <div className="mt-auto pt-5 border-t border-gray-800/50 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-[#f8fafc] font-bold text-sm">{doctor.rating}</span>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {doctor.experience_years} Years Exp.
                  </span>
                </div>

                <button
                  id={`book-doctor-${doctor.id}`}
                  onClick={() => openBookingModal(doctor)}
                  className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[14px] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 border border-cyan-400/50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Booking Modal (White Theme) ── */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="bg-[#1b3a6b] px-6 py-5 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Book Appointment</h2>
                <p className="text-sm text-blue-100/80 mt-0.5">{selectedDoctor.name}</p>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto w-full">

              {bookingResult && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${bookingResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {bookingResult.success ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium">{bookingResult.message}</p>
                </div>
              )}

              {/* Department & Doctor Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Department</label>
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-4 py-3 text-sm font-medium h-[68px] flex flex-col justify-center">
                    {selectedDoctor.specialization}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Preferred Doctor</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-[68px] flex flex-col justify-center">
                    <p className="text-sm font-semibold text-slate-800">{selectedDoctor.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{selectedDoctor.hospital}</p>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Describe your symptoms <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Brief description of your health concern..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl p-4 focus:outline-none focus:border-[#1b3a6b]/50 focus:ring-1 focus:ring-[#1b3a6b]/20 transition-all resize-none text-sm"
                />
              </div>

              {/* Date Selection */}
              <div className="mb-6 relative">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Date</label>
                <div className="relative inline-block w-1/2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#1b3a6b]/50 cursor-pointer"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      // Demo logic: Just trigger a loading state when a date is selected to mock API fetching
                      setSlotsLoading(true)
                      setTimeout(() => setSlotsLoading(false), 800)
                    }}
                  />
                </div>
              </div>

              {/* Slots */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-[13px] font-bold text-slate-800">Available Time Slots</h3>
                  <span className="text-xs font-semibold text-slate-400">Select above</span>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1b3a6b]/50" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 border-dashed text-center">
                    <p className="text-sm text-slate-500">Please select a date to view available time slots.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${selectedSlot?.datetime === slot.datetime
                          ? 'bg-blue-50 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        <span className={`text-[13px] font-medium ${selectedSlot?.datetime === slot.datetime ? 'text-blue-700' : 'text-slate-700'}`}>
                          {slot.time}
                        </span>
                        {selectedSlot?.datetime === slot.datetime && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={closeBookingModal}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all border border-slate-200 text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || booking}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-semibold text-white shadow-sm ${!selectedSlot || booking ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1b3a6b] hover:bg-[#12284c]'}`}
                >
                  {booking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Processing</>
                  ) : (
                    <>Confirm Booking</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorsPage

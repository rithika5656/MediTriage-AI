/**
 * Doctors Page Component
 * Browse doctors, view availability, and book appointments
 */
import { useState, useEffect } from 'react'
import doctorService from '../services/doctorService'
import appointmentService from '../services/appointmentService'
import { 
  Search, Star, Calendar, Clock, User, X,
  ChevronDown, Loader2, CheckCircle, AlertCircle
} from 'lucide-react'

function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')
  
  // Booking modal state
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
    if (!searchQuery.trim()) {
      loadDoctors()
      return
    }
    
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
      console.error('Failed to load slots:', error)
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
      
      // Refresh slots after booking
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

  const filteredDoctors = doctors

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Find a Doctor</h1>
        <p className="text-gray-600 mt-1">Browse our specialists and book an appointment</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or specialization..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        {/* Specialization Filter */}
        <div className="relative">
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No doctors found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{doctor.name}</h3>
                  <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
                  <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium">{doctor.rating}</span>
                </div>
                <span className="text-gray-500">{doctor.experience_years} years exp.</span>
              </div>
              
              <button
                onClick={() => openBookingModal(doctor)}
                className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Book Appointment</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDoctor.name}</p>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Booking Result */}
              {bookingResult && (
                <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                  bookingResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {bookingResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${bookingResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {bookingResult.message}
                  </p>
                </div>
              )}

              {/* Symptoms Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your symptoms (optional)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Brief description of your health concern..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Available Slots */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select a time slot</h3>
                
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No available slots</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedSlot?.datetime === slot.datetime
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {slot.day}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{slot.date}</div>
                        <div className="flex items-center gap-1 text-sm text-primary-600 mt-1">
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
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeBookingModal}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={!selectedSlot || booking}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Booking
                  </>
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

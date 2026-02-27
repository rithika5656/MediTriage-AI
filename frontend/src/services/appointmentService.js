/**
 * Appointment Service
 * Handles all appointment-related API calls
 */
import api from './api'

const appointmentService = {
  /**
   * Get user's appointments
   * @param {Object} params - Filter parameters
   * @returns {Promise} List of appointments
   */
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params })
    return response.data
  },

  /**
   * Book a new appointment
   * @param {Object} data - Appointment data
   * @returns {Promise} Booking result
   */
  bookAppointment: async (data) => {
    const response = await api.post('/appointments', data)
    return response.data
  },

  /**
   * Book emergency appointment
   * @param {Object} data - Emergency booking data
   * @returns {Promise} Emergency booking result
   */
  bookEmergency: async (data) => {
    const response = await api.post('/appointments/emergency', data)
    return response.data
  },

  /**
   * Get appointment details
   * @param {number} id - Appointment ID
   * @returns {Promise} Appointment details
   */
  getAppointment: async (id) => {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  },

  /**
   * Cancel an appointment
   * @param {number} id - Appointment ID
   * @returns {Promise} Cancellation result
   */
  cancelAppointment: async (id) => {
    const response = await api.post(`/appointments/${id}/cancel`)
    return response.data
  },

  /**
   * Get nearby hospitals
   * @returns {Promise} List of hospitals
   */
  getHospitals: async () => {
    const response = await api.get('/appointments/hospitals')
    return response.data
  }
}

export default appointmentService

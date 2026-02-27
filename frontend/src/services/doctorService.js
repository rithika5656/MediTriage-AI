/**
 * Doctor Service
 * Handles all doctor-related API calls
 */
import api from './api'

const doctorService = {
  /**
   * Get list of doctors
   * @param {Object} params - Filter parameters
   * @returns {Promise} List of doctors
   */
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params })
    return response.data
  },

  /**
   * Get list of available specializations
   * @returns {Promise} List of specializations
   */
  getSpecializations: async () => {
    const response = await api.get('/doctors/specializations')
    return response.data
  },

  /**
   * Get doctor details
   * @param {number} id - Doctor ID
   * @returns {Promise} Doctor details
   */
  getDoctor: async (id) => {
    const response = await api.get(`/doctors/${id}`)
    return response.data
  },

  /**
   * Get available slots for a doctor
   * @param {number} id - Doctor ID
   * @param {string} date - Optional date filter (YYYY-MM-DD)
   * @returns {Promise} Available slots
   */
  getSlots: async (id, date = null) => {
    const params = date ? { date } : {}
    const response = await api.get(`/doctors/${id}/slots`, { params })
    return response.data
  },

  /**
   * Search doctors
   * @param {string} query - Search query
   * @returns {Promise} Matching doctors
   */
  searchDoctors: async (query) => {
    const response = await api.get('/doctors/search', { params: { q: query } })
    return response.data
  }
}

export default doctorService

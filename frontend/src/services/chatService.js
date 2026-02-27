/**
 * Chat Service
 * Handles all chat-related API calls
 */
import api from './api'

const chatService = {
  /**
   * Send a message and get response
   * @param {string} message - User's message
   * @returns {Promise} Response with triage assessment
   */
  sendMessage: async (message) => {
    const response = await api.post('/chat/message', { message })
    return response.data
  },

  /**
   * Get chat history for current user
   * @param {number} limit - Maximum messages to retrieve
   * @returns {Promise} Chat history array
   */
  getHistory: async (limit = 50) => {
    const response = await api.get('/chat/history', { params: { limit } })
    return response.data
  },

  /**
   * Get current session context
   * @returns {Promise} Session data
   */
  getSession: async () => {
    const response = await api.get('/chat/session')
    return response.data
  },

  /**
   * Reset conversation session
   * @returns {Promise} New session info
   */
  resetSession: async () => {
    const response = await api.post('/chat/session/reset')
    return response.data
  },

  /**
   * Get quick response options
   * @returns {Promise} Quick response categories
   */
  getQuickResponses: async () => {
    const response = await api.get('/chat/quick-responses')
    return response.data
  }
}

export default chatService

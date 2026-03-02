/**
 * Chat Service
 * ============
 * Handles all chat-related API calls to the MediTriage Django backend.
 * Endpoint: POST /api/chat/
 */
import api from './api'

const chatService = {
  /**
   * Send a symptom message and receive a structured triage assessment.
   *
   * @param {string} message   – User's symptom text (any language)
   * @param {Array}  history   – Previous conversation turns for multi-turn context
   *                             Format: [{ role: 'user'|'assistant', content: '...' }]
   * @returns {Promise<Object>} Triage response:
   *   {
   *     triage_score, health_stability_score, risk_level,
   *     medical_advice, detected_symptoms, recommended_action
   *   }
   */
  sendMessage: async (message, history = []) => {
    const response = await api.post('/chat/', { message, history })
    return response.data
  },

  analyzeFace: async (base64Image) => {
    const response = await api.post('/analyze-face/', { image: base64Image })
    return response.data
  }
}

export default chatService

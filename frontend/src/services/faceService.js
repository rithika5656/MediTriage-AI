/**
 * Face Recognition Service
 * Handles API calls for face registration and verification
 */
import api from './api'

/**
 * Register face embeddings for authenticated user
 * @param {string[]} faceSamples - Array of base64 encoded face images
 * @returns {Promise<{success: boolean, message: string, samples_processed: number}>}
 */
export const registerFace = async (faceSamples) => {
  try {
    const response = await api.post('/auth/register-face/', {
      face_samples: faceSamples
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { error: 'Face registration failed' }
  }
}

/**
 * Verify face and login
 * @param {string} faceImage - Base64 encoded face image
 * @returns {Promise<{match: boolean, confidence: number, user?: object, access_token?: string}>}
 */
export const verifyFace = async (faceImage) => {
  try {
    const response = await api.post('/auth/verify-face/', {
      face_image: faceImage
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { error: 'Face verification failed' }
  }
}

/**
 * Check if current user has face registered
 * @returns {Promise<{has_face_registered: boolean}>}
 */
export const checkFaceRegistration = async () => {
  try {
    const response = await api.get('/auth/check-face-registration/')
    return response.data
  } catch (error) {
    throw error.response?.data || { error: 'Failed to check face registration' }
  }
}

/**
 * Delete face registration for current user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteFaceRegistration = async () => {
  try {
    const response = await api.delete('/auth/delete-face/')
    return response.data
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete face registration' }
  }
}

export default {
  registerFace,
  verifyFace,
  checkFaceRegistration,
  deleteFaceRegistration
}

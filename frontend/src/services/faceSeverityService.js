import api from './api';

export const analyzeFaceSeverity = async (imageData) => {
  try {
    const response = await api.post('/analyze-face/', {
      image: imageData,
    });
    return response.data;
  } catch (error) {
    console.error('Face severity analysis failed:', error);
    throw error;
  }
};

export default {
  analyzeFaceSeverity,
};

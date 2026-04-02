import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const aiAssistantAPI = {
  // Analyse l'idée de projet
  analyzeIdea: async (userInput) => {
    const response = await axios.post(`${API_URL}/api/ai-assistant/analyze`, {
      user_input: userInput
    });
    return response.data;
  },

  // Génère la description complète
  generateDescription: async (userInput, answers = {}) => {
    const response = await axios.post(`${API_URL}/api/ai-assistant/generate`, {
      user_input: userInput,
      answers: answers
    });
    return response.data;
  }
};

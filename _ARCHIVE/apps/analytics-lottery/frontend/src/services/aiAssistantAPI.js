import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000");

export const aiAssistantAPI = {
  // Analyse l'idÃ©e de projet
  analyzeIdea: async (userInput) => {
    const response = await axios.post(`${API_URL}/api/ai-assistant/analyze`, {
      user_input: userInput
    });
    return response.data;
  },

  // GÃ©nÃ¨re la description complÃ¨te
  generateDescription: async (userInput, answers = {}) => {
    const response = await axios.post(`${API_URL}/api/ai-assistant/generate`, {
      user_input: userInput,
      answers: answers
    });
    return response.data;
  }
};


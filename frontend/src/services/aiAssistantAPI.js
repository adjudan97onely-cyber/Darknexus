import api from './axiosConfig';

export const aiAssistantAPI = {
  // Analyse l'idée de projet
  analyzeIdea: async (userInput) => {
    const response = await api.post(`/api/ai-assistant/analyze`, {
      user_input: userInput
    });
    return response.data;
  },

  // Génère la description complète
  generateDescription: async (userInput, answers = {}) => {
    const response = await api.post(`/api/ai-assistant/generate`, {
      user_input: userInput,
      answers: answers
    });
    return response.data;
  }
};

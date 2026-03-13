import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const projectsAPI = {
  // Créer un nouveau projet
  createProject: async (projectData) => {
    const response = await axios.post(`${API}/projects`, projectData);
    return response.data;
  },

  // Récupérer tous les projets
  getProjects: async () => {
    const response = await axios.get(`${API}/projects`);
    return response.data;
  },

  // Récupérer un projet spécifique
  getProject: async (projectId) => {
    const response = await axios.get(`${API}/projects/${projectId}`);
    return response.data;
  },

  // Supprimer un projet
  deleteProject: async (projectId) => {
    const response = await axios.delete(`${API}/projects/${projectId}`);
    return response.data;
  }
};

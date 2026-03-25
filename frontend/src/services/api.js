import api from './axiosConfig';

export const projectsAPI = {
  // Créer un nouveau projet
  createProject: async (projectData) => {
    const response = await api.post(`/api/projects`, projectData);
    return response.data;
  },

  // Récupérer tous les projets
  getProjects: async () => {
    const response = await api.get(`/api/projects`);
    return response.data;
  },

  // Récupérer un projet spécifique
  getProject: async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  },

  // Améliorer un projet existant
  improveProject: async (projectId, improvementData) => {
    const response = await api.post(`/api/projects/${projectId}/improve`, improvementData);
    return response.data;
  },

  // Mettre à jour les informations d'un projet
  updateProject: async (projectId, updateData) => {
    const response = await api.put(`/api/projects/${projectId}`, updateData);
    return response.data;
  },

  // Télécharger un projet en ZIP
  downloadProject: async (projectId, projectName) => {
    const response = await api.get(`/api/projects/${projectId}/download`, {
      responseType: 'blob'
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Supprimer un projet
  deleteProject: async (projectId) => {
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
  }
};

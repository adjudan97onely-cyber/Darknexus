import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5002",
  timeout: 15000,
});

export async function analyzeIngredients(payload) {
  const response = await api.post("/api/analyze-ingredients", payload);
  return response.data;
}

export async function analyzePhoto(payload) {
  const response = await api.post("/api/analyze-photo", payload);
  return response.data;
}

export async function getHistory(limit = 6) {
  const response = await api.get(`/api/history?limit=${limit}`);
  return response.data;
}

export async function getStats() {
  const response = await api.get("/api/stats");
  return response.data;
}

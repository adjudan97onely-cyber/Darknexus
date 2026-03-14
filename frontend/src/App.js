import React from "react";
import "@/App.css";
import "@/animations.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateProjectPage from "./pages/CreateProjectPage";
import QuickCreatePage from "./pages/QuickCreatePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import WebScraperPage from "./pages/WebScraperPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingVoiceAssistant from "./components/FloatingVoiceAssistant";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const location = useLocation();
  const showFloatingAssistant = location.pathname !== '/login' && 
                                 location.pathname !== '/create' &&
                                 location.pathname !== '/quick-create' &&
                                 location.pathname !== '/assistant';

  return (
    <>
      <Routes>
        {/* Route publique : Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Routes protégées : Nécessitent authentification */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
        <Route path="/quick-create" element={<ProtectedRoute><QuickCreatePage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/voice-assistant" element={<ProtectedRoute><VoiceAssistantPage /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/scraper" element={<ProtectedRoute><WebScraperPage /></ProtectedRoute>} />
      </Routes>
      
      {/* Assistant Vocal Flottant - Accessible partout sauf sur la page de login */}
      {showFloatingAssistant && <FloatingVoiceAssistant />}
      
      <Toaster />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;

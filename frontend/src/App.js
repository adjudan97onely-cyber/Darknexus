import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateProjectPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;

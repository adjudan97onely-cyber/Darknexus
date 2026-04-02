import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Sparkles, ArrowLeft, Search, Plus, Clock, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { projectsAPI } from '../services/api';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'in-progress':
        return 'En cours';
      default:
        return 'En attente';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'web-app': '🌐 Web App',
      'python-script': '🐍 Python',
      'excel-automation': '📊 Excel',
      'game-script': '🎮 Jeu',
      'ai-app': '🤖 IA',
      'api': '🔌 API'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Accueil
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CodeForge AI
                </span>
              </div>
            </div>
            <Button onClick={() => navigate('/create')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Projet
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Mes Projets</h1>
            <p className="text-slate-400 text-lg">Gérez et explorez tous vos projets générés par IA</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
              <p className="text-slate-400">Chargement des projets...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-slate-600 text-6xl mb-4">📁</div>
              <h3 className="text-2xl font-semibold text-slate-300 mb-2">Aucun projet trouvé</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier projet pour commencer'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/create')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Projet
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all duration-300 hover:border-purple-500/30 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                        {getTypeLabel(project.type)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(project.status)}
                        <span className="text-xs text-slate-400">{getStatusLabel(project.status)}</span>
                      </div>
                    </div>
                    <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-400 mb-4 line-clamp-2">
                      {project.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tech_stack.slice(0, 3).map((tech, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                          {tech}
                        </Badge>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          +{project.tech_stack.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
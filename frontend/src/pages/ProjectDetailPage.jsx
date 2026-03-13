import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle2, Code2, FileCode, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { projectsAPI } from '../services/api';

const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  const [copiedFile, setCopiedFile] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getProject(projectId);
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white">Chargement du projet...</h2>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Projet non trouvé</h2>
          <Button onClick={() => navigate('/projects')} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Retour aux projets
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyCode = (code, filename) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    toast({
      title: "Code copié !",
      description: `Le code de ${filename} a été copié dans le presse-papier`
    });
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadProject = () => {
    toast({
      title: "Téléchargement démarré",
      description: "Votre projet est en cours de téléchargement"
    });
    // Logique de téléchargement à implémenter
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/projects')} className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Mes Projets
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
            <Button onClick={handleDownloadProject} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                {project.type}
              </Badge>
              {project.status === 'completed' && (
                <div className="flex items-center text-green-400">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span className="text-sm">Complété</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">{project.name}</h1>
            <p className="text-slate-400 text-lg mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech, idx) => (
                <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-300">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Fichiers générés</p>
                    <p className="text-2xl font-bold text-white">{project.code_files.length}</p>
                  </div>
                  <FileCode className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Lignes de code</p>
                    <p className="text-2xl font-bold text-white">
                      {project.code_files.reduce((acc, file) => acc + file.content.split('\n').length, 0)}
                    </p>
                  </div>
                  <Code2 className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Créé le</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Files */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Code Généré</CardTitle>
              <CardDescription className="text-slate-400">
                Tous les fichiers de code générés par l'IA pour votre projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.code_files.length === 0 ? (
                <div className="text-center py-12">
                  <Code2 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Le code est en cours de génération...</p>
                </div>
              ) : (
                <Tabs defaultValue={project.code_files[0]?.filename} className="w-full">
                  <TabsList className="bg-slate-800 border-slate-700 flex-wrap h-auto">
                    {project.code_files.map((file) => (
                      <TabsTrigger
                        key={file.filename}
                        value={file.filename}
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
                      >
                        {file.filename}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {project.code_files.map((file) => (
                    <TabsContent key={file.filename} value={file.filename} className="mt-4">
                      <div className="relative">
                        <div className="absolute top-3 right-3 z-10">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyCode(file.content, file.filename)}
                            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                          >
                            {copiedFile === file.filename ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Copié !
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copier
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-6 overflow-x-auto">
                          <code className="text-sm text-slate-300 font-mono">{file.content}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle2, Code2, FileCode, Loader2, Wrench, Share2, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { projectsAPI } from '../services/api';
import VoiceInput from '../components/VoiceInput';

const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  const [copiedFile, setCopiedFile] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImproving, setIsImproving] = useState(false);
  const [improvementDescription, setImprovementDescription] = useState('');
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', type: '' });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getProject(projectId);
      setProject(data);
      setEditFormData({
        name: data.name,
        description: data.description,
        type: data.type
      });
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

  const handleDownloadProject = async () => {
    try {
      await projectsAPI.downloadProject(projectId, project.name);
      toast({
        title: "📦 Téléchargement démarré",
        description: "Votre projet est en cours de téléchargement"
      });
    } catch (error) {
      console.error('Error downloading project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le projet",
        variant: "destructive"
      });
    }
  };

  const handleImproveProject = async () => {
    if (!improvementDescription || improvementDescription.length < 20) {
      toast({
        title: "Erreur",
        description: "Décrivez les améliorations souhaitées (min 20 caractères)",
        variant: "destructive"
      });
      return;
    }

    setIsImproving(true);
    try {
      const updatedProject = await projectsAPI.improveProject(projectId, {
        description: improvementDescription,
        ai_model: 'gpt-5.1'
      });
      
      setProject(updatedProject);
      setShowImproveModal(false);
      setImprovementDescription('');
      
      toast({
        title: "✨ Projet amélioré !",
        description: "Les améliorations ont été appliquées avec succès"
      });
    } catch (error) {
      console.error('Error improving project:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Impossible d'améliorer le projet",
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setImprovementDescription(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleEditProject = async () => {
    if (!editFormData.name || editFormData.name.length < 3) {
      toast({
        title: "Erreur",
        description: "Le nom doit contenir au moins 3 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedProject = await projectsAPI.updateProject(projectId, editFormData);
      setProject(updatedProject);
      setShowEditModal(false);
      
      toast({
        title: "✅ Projet mis à jour !",
        description: "Les modifications ont été enregistrées"
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Impossible de mettre à jour le projet",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await projectsAPI.deleteProject(projectId);
      toast({
        title: "🗑️ Projet supprimé",
        description: "Le projet a été supprimé avec succès"
      });
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Impossible de supprimer le projet",
        variant: "destructive"
      });
    }
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
            <div className="flex items-center gap-3">
              <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Edit className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center">
                      <Edit className="w-6 h-6 mr-2 text-purple-400" />
                      Éditer le Projet
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Modifiez les informations de votre projet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Nom du projet *</Label>
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-200">Description *</Label>
                      <Textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        rows={5}
                        className="bg-slate-800 border-slate-700 text-white resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 border-slate-700"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleEditProject}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showImproveModal} onOpenChange={setShowImproveModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    <Wrench className="w-4 h-4 mr-2" />
                    Améliorer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center">
                      <Wrench className="w-6 h-6 mr-2 text-purple-400" />
                      Améliorer le Projet
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Décrivez les améliorations ou modifications souhaitées
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-200">Améliorations *</Label>
                        <VoiceInput onTranscript={handleVoiceTranscript} disabled={isImproving} />
                      </div>
                      <Textarea
                        placeholder="Exemple:\n- Ajouter une recherche\n- Améliorer le design\n- Ajouter sauvegarde\n- Corriger bug..."
                        value={improvementDescription}
                        onChange={(e) => setImprovementDescription(e.target.value)}
                        rows={6}
                        className="bg-slate-800 border-slate-700 text-white resize-none"
                        disabled={isImproving}
                      />
                      <p className="text-sm text-slate-500">{improvementDescription.length} / 20 min</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowImproveModal(false)}
                        className="flex-1 border-slate-700"
                        disabled={isImproving}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleImproveProject}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        disabled={isImproving}
                      >
                        {isImproving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            En cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Améliorer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleDownloadProject} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Télécharger ZIP
              </Button>
              <Button onClick={handleDeleteProject} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
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
              {project.ai_model_used && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">
                  🤖 {project.ai_model_used}
                </Badge>
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
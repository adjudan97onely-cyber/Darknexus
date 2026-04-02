import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, Zap, Rocket } from 'lucide-react';
import { projectTypes } from '../mock/mockData';
import { useToast } from '../hooks/use-toast';
import WhisperVoiceInput from '../components/WhisperVoiceInput';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const QuickCreatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [generatedProjectId, setGeneratedProjectId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    ai_model: 'gpt-4o-mini'  // Modèle rapide par défaut
  });

  const quickModels = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Rapide)', icon: '⚡' },
    { id: 'gpt-5.1', name: 'GPT-5.1 (Équilibré)', icon: '⭐' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Rapide)', icon: '🚀' }
  ];

  const handleVoiceTranscript = (transcript) => {
    setFormData(prev => ({
      ...prev,
      description: transcript
    }));
  };

  const handleQuickGenerate = async () => {
    if (!formData.name || !formData.description || !formData.type) {
      toast({
        title: "Erreur",
        description: "Remplis tous les champs !",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('init');
    setCurrentMessage('Démarrage...');

    try {
      // Utiliser fetch pour le streaming (pas axios)
      const response = await fetch(`${BACKEND_URL}/api/streaming/generate-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            setProgress(data.progress || 0);
            setCurrentStep(data.step || '');
            setCurrentMessage(data.message || '');

            if (data.status === 'success') {
              setGeneratedProjectId(data.project_id);
              toast({
                title: "🎉 Projet créé !",
                description: `${data.files_count} fichiers générés`
              });
              
              // Rediriger après 2 secondes
              setTimeout(() => {
                navigate(`/project/${data.project_id}`);
              }, 2000);
            }

            if (data.status === 'error') {
              toast({
                title: "Erreur",
                description: data.message,
                variant: "destructive"
              });
              setIsGenerating(false);
            }
          } catch (e) {
            // Ignorer les lignes mal formatées
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 font-semibold text-sm">Génération Rapide</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Création Express</h1>
            <p className="text-slate-400 text-lg">Avec feedback en temps réel !</p>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-purple-400" />
                Projet Rapide
              </CardTitle>
              <CardDescription className="text-slate-400">
                Remplis les champs et regarde la magie opérer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Nom du Projet *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Todo App"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isGenerating}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-200">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })} disabled={isGenerating}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Choisis un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {projectTypes.slice(0, 4).map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white hover:bg-slate-700">
                        <span className="mr-2">{type.icon}</span>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modèle */}
              <div className="space-y-2">
                <Label htmlFor="model" className="text-slate-200">Modèle IA</Label>
                <Select value={formData.ai_model} onValueChange={(value) => setFormData({ ...formData, ai_model: value })} disabled={isGenerating}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {quickModels.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-white hover:bg-slate-700">
                        <span className="mr-2">{model.icon}</span>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-slate-200">Description *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">✨ Whisper AI :</span>
                    <WhisperVoiceInput 
                      onTranscript={handleVoiceTranscript}
                      disabled={isGenerating}
                      showTranscript={false}
                    />
                  </div>
                </div>
                <Textarea
                  id="description"
                  placeholder="Décris ton projet rapidement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isGenerating}
                  rows={4}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Indicateur de progression */}
              {isGenerating && (
                <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">{currentMessage}</span>
                    <span className="text-purple-400 font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  {progress === 100 && (
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Génération terminée ! Redirection...
                    </div>
                  )}
                </div>
              )}

              {/* Bouton */}
              <Button
                onClick={handleQuickGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer Maintenant !
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickCreatePage;

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Sparkles, ArrowLeft, Wand2, Loader2 } from 'lucide-react';
import { projectTypes } from '../mock/mockData';
import { useToast } from '../hooks/use-toast';
import { projectsAPI } from '../services/api';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: location.state?.selectedType || '',
    tech_stack: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.description.length < 20) {
      toast({
        title: "Erreur",
        description: "La description doit contenir au moins 20 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const project = await projectsAPI.createProject(formData);
      
      toast({
        title: "✨ Projet créé !",
        description: "Votre code a été généré avec succès"
      });
      
      // Rediriger vers la page du projet
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Erreur lors de la création du projet",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
                Retour
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Créer un Nouveau Projet</h1>
            <p className="text-slate-400 text-lg">Décrivez votre projet et laissez l'IA générer le code</p>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wand2 className="w-5 h-5 mr-2 text-purple-400" />
                Informations du Projet
              </CardTitle>
              <CardDescription className="text-slate-400">
                Fournissez les détails de votre projet pour une génération optimale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom du projet */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Nom du Projet *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Analyseur de Photos Cuisine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Type de projet */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-200">Type de Projet *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:border-purple-500">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {projectTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className="text-white hover:bg-slate-700">
                          <span className="mr-2">{type.icon}</span>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stack technique */}
                <div className="space-y-2">
                  <Label htmlFor="tech_stack" className="text-slate-200">Stack Technique (optionnel)</Label>
                  <Input
                    id="tech_stack"
                    placeholder="Ex: React, FastAPI, PostgreSQL"
                    value={formData.tech_stack}
                    onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors"
                  />
                  <p className="text-sm text-slate-500">Laissez vide pour laisser l'IA choisir</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-200">Description Détaillée *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail. Plus vous donnez de détails, meilleur sera le code généré.\n\nExemple:\n- Une application qui prend une photo d'ingrédients\n- Utilise l'IA pour identifier les ingrédients\n- Suggère des recettes possibles\n- Affiche les recettes avec instructions\n- Permet de sauvegarder les favoris"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={10}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors resize-none"
                  />
                  <p className="text-sm text-slate-500">Minimum 50 caractères recommandés</p>
                </div>

                {/* Selected type info */}
                {formData.type && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {projectTypes.find(t => t.id === formData.type)?.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {projectTypes.find(t => t.id === formData.type)?.name}
                        </h3>
                        <p className="text-slate-400 text-sm mb-3">
                          {projectTypes.find(t => t.id === formData.type)?.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {projectTypes.find(t => t.id === formData.type)?.stacks.map((stack, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                              {stack}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                    disabled={isGenerating}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 shadow-lg shadow-purple-500/25"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Générer le Code
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
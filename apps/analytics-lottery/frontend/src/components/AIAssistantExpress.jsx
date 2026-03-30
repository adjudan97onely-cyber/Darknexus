import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { aiAssistantAPI } from '../services/aiAssistantAPI';
import { useToast } from '../hooks/use-toast';

const AIAssistantExpress = ({ onProjectGenerated }) => {
  const { toast } = useToast();
  const [step, setStep] = useState('input'); // input, questions, generating, done
  const [userIdea, setUserIdea] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generatedProject, setGeneratedProject] = useState(null);

  const handleAnalyze = async () => {
    if (!userIdea.trim()) {
      toast({
        title: "Erreur",
        description: "Décris ton idée de projet",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiAssistantAPI.analyzeIdea(userIdea);
      
      if (result.needs_clarification && result.questions.length > 0) {
        // L'IA a des questions
        setQuestions(result.questions);
        setStep('questions');
      } else {
        // L'IA a tout compris, génération directe
        await generateFullProject(result.project_analysis);
      }
    } catch (error) {
      console.error('Error analyzing idea:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser l'idée",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWithAnswers = async () => {
    setIsLoading(true);
    setStep('generating');
    
    try {
      const result = await aiAssistantAPI.generateDescription(userIdea, answers);
      setGeneratedProject(result);
      setStep('done');
      
      // Notifier le parent avec le projet généré
      if (onProjectGenerated) {
        onProjectGenerated(result);
      }
      
      toast({
        title: "✨ Projet généré !",
        description: "Le formulaire a été rempli automatiquement"
      });
    } catch (error) {
      console.error('Error generating project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le projet",
        variant: "destructive"
      });
      setStep('questions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFullProject = async (analysis) => {
    setStep('generating');
    setIsLoading(true);
    
    try {
      const result = await aiAssistantAPI.generateDescription(userIdea, {});
      setGeneratedProject(result);
      setStep('done');
      
      if (onProjectGenerated) {
        onProjectGenerated(result);
      }
      
      toast({
        title: "✨ Projet généré !",
        description: "Le formulaire a été rempli automatiquement"
      });
    } catch (error) {
      console.error('Error generating project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le projet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setUserIdea('');
    setQuestions([]);
    setAnswers({});
    setGeneratedProject(null);
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <CardTitle className="text-2xl">Assistant IA Express</CardTitle>
        </div>
        <CardDescription className="text-base">
          Décris ton projet en une phrase, l'IA s'occupe du reste ! ✨
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ÉTAPE 1: Saisie de l'idée */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="idea" className="text-base font-medium">
                💡 Quelle est ton idée ?
              </Label>
              <p className="text-sm text-slate-400 mb-2">
                Exemples: "App de recettes antillaises", "Jeu mobile style Tetris", "Bot Instagram automatique", "Logiciel de comptabilité"
              </p>
              <Input
                id="idea"
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="Ex: Application de recettes antillaises avec photos et favoris"
                className="text-base h-12"
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleAnalyze()}
              />
            </div>
            
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !userIdea.trim()}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyser avec l'IA
                </>
              )}
            </Button>
          </div>
        )}

        {/* ÉTAPE 2: Questions de clarification */}
        {step === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-200">L'IA a quelques questions pour mieux comprendre:</p>
              </div>
            </div>

            {questions.map((question, index) => (
              <div key={index}>
                <Label className="text-base font-medium">
                  {index + 1}. {question}
                </Label>
                <Input
                  value={answers[`q${index}`] || ''}
                  onChange={(e) => setAnswers({...answers, [`q${index}`]: e.target.value})}
                  placeholder="Ta réponse..."
                  className="mt-2"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Recommencer
              </Button>
              <Button
                onClick={handleGenerateWithAnswers}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer le projet
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Génération en cours */}
        {step === 'generating' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin" />
            <p className="text-lg font-medium">✨ L'IA crée ton projet...</p>
            <p className="text-sm text-slate-400">Analyse et génération de la description complète</p>
          </div>
        )}

        {/* ÉTAPE 4: Terminé */}
        {step === 'done' && generatedProject && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-200">Projet généré avec succès !</p>
                <p className="text-sm text-green-300/70">Le formulaire ci-dessous a été rempli automatiquement</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
              <p className="text-sm text-slate-400">Aperçu:</p>
              <p className="font-medium">{generatedProject.name}</p>
              <p className="text-sm text-slate-300">{generatedProject.description.substring(0, 150)}...</p>
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              Créer un autre projet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistantExpress;

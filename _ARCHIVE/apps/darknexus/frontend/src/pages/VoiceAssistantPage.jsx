import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Mic, Sparkles, MessageSquare, Zap, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceAssistantPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [voiceInput, setVoiceInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandResult, setCommandResult] = useState(null);
  const [availableCommands, setAvailableCommands] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    loadAvailableCommands();
  }, []);

  const loadAvailableCommands = async () => {
    try {
      const response = await axios.get(`${API}/chat/voice-commands`);
      setAvailableCommands(response.data.commands);
    } catch (error) {
      console.error('Error loading commands:', error);
    }
  };

  const handleVoiceTranscript = async (transcript) => {
    setVoiceInput(transcript);
    await processVoiceCommand(transcript);
  };

  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    
    try {
      const response = await axios.post(`${API}/chat/voice-command`, {
        voice_input: command
      });

      setCommandResult(response.data);
      
      // Ajouter à l'historique
      const newEntry = {
        timestamp: new Date(),
        input: command,
        result: response.data
      };
      setConversationHistory(prev => [...prev, newEntry]);

      // Afficher le résultat
      if (response.data.is_command) {
        toast({
          title: "✅ Commande reconnue !",
          description: response.data.confirmation
        });

        if (response.data.executed) {
          toast({
            title: "🎉 Action effectuée !",
            description: response.data.message
          });
        }
      } else {
        toast({
          title: "💬 Message capturé",
          description: "Utilisez ce texte dans le chat"
        });
      }
    } catch (error) {
      console.error('Error processing command:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la commande",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeQuickCommand = (command) => {
    setVoiceInput(command.example);
    processVoiceCommand(command.example);
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
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Assistant Vocal
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Contrôlez votre app <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">par la voix</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Parlez naturellement à l'assistant pour créer, modifier et améliorer vos projets sans toucher le clavier
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Voice Input Section */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-purple-400" />
                  Commande Vocale
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cliquez sur le micro et parlez en continu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Voice Input Component */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                  <VoiceInput
                    onTranscript={handleVoiceTranscript}
                    showTranscript={true}
                    disabled={isProcessing}
                  />
                  <p className="text-sm text-slate-400 mt-4 text-center">
                    Appuyez sur le micro, parlez, puis arrêtez quand vous avez fini
                  </p>
                </div>

                {/* Current Input Display */}
                {voiceInput && (
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">📝 Dernière commande :</p>
                    <p className="text-white">{voiceInput}</p>
                  </div>
                )}

                {/* Command Result */}
                {commandResult && (
                  <div className={`p-4 rounded-lg border ${
                    commandResult.is_command 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-blue-900/20 border-blue-800'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Badge variant={commandResult.is_command ? "default" : "secondary"}>
                        {commandResult.is_command ? '🎯 Commande' : '💬 Message'}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1">
                          {commandResult.confirmation}
                        </p>
                        {commandResult.executed && (
                          <p className="text-green-400 text-sm">
                            ✅ {commandResult.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                {conversationHistory.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300">📜 Historique</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {conversationHistory.slice(-5).reverse().map((entry, idx) => (
                        <div key={idx} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                          <p className="text-xs text-slate-400">
                            {entry.timestamp.toLocaleTimeString('fr-FR')}
                          </p>
                          <p className="text-sm text-white mt-1">{entry.input}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {entry.result.action}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commands Reference */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-pink-400" />
                  Commandes Disponibles
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cliquez pour essayer ou dictez naturellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {availableCommands.map((cmd, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500 transition-all cursor-pointer group"
                      onClick={() => executeQuickCommand(cmd)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                            {cmd.command}
                          </h4>
                          <p className="text-sm text-slate-400 mt-1 italic">
                            "{cmd.example}"
                          </p>
                        </div>
                        <Zap className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-2">💡 Astuce Pro</h4>
                      <p className="text-sm text-slate-300">
                        Vous n'avez pas besoin de phrases exactes ! L'assistant comprend le langage naturel.
                        Parlez comme vous voulez, il comprendra votre intention.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Reconnaissance Vocale Continue</h3>
                <p className="text-sm text-slate-400">
                  Parlez aussi longtemps que nécessaire, l'assistant capturera tout
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Compréhension Naturelle</h3>
                <p className="text-sm text-slate-400">
                  L'IA comprend vos intentions même si vous ne connaissez pas les commandes exactes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Actions Instantanées</h3>
                <p className="text-sm text-slate-400">
                  Les commandes sont exécutées immédiatement sans confirmation supplémentaire
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantPage;

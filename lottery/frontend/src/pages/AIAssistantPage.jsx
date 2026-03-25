import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, Loader2, Paperclip, Mic, User, Bot, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import VoiceInput from '../components/VoiceInput';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * ASSISTANT IA - Interface identique à Emergent
 * Permet de discuter avec l'IA comme avec un vrai agent
 */
const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Salut ! Je suis ton assistant IA personnel, exactement comme l'agent Emergent !

💪 **Je peux t'aider à** :
- Créer n'importe quel type de projet (web, Python, Excel, IA, etc.)
- Modifier et améliorer tes applications
- Répondre à tes questions techniques
- Déboguer ton code
- Te donner des conseils et des idées

🎤 **Comment m'utiliser** :
- Écris ta demande dans la zone de texte
- Ou clique sur le micro pour parler
- Je comprends le langage naturel, parle-moi comme à un ami !

**Qu'est-ce que tu veux créer aujourd'hui ?** 🚀`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
    toast({
      title: "Fichiers ajoutés",
      description: `${files.length} fichier(s) ajouté(s)`
    });
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage = input.trim();
    const files = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);

    // Ajouter le message utilisateur
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      files: files.length > 0 ? files.map(f => f.name) : null
    };
    setMessages(prev => [...prev, newUserMsg]);

    // Ajouter un message de progression
    const progressMsg = {
      role: 'assistant',
      content: '🔄 Traitement en cours...',
      timestamp: new Date().toISOString(),
      isProgress: true,
      progress: ['Analyse de ta demande...']
    };
    setMessages(prev => [...prev, progressMsg]);
    
    setIsLoading(true);

    try {
      // Convertir les images en base64 si présentes
      const imageData = [];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          imageData.push(base64);
        }
      }

      // Envoyer au backend avec images
      const response = await axios.post(`${API}/assistant/chat`, {
        message: userMessage,
        conversation_history: messages.slice(-10),
        images: imageData.length > 0 ? imageData : null
      });

      // Retirer le message de progression
      setMessages(prev => prev.filter(m => !m.isProgress));

      // Ajouter la réponse de l'IA avec les étapes de progression
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        action: response.data.action || null,
        project_created: response.data.project_id || null,
        files_created: response.data.files_created || null,
        progress: response.data.progress || null
      };
      setMessages(prev => [...prev, aiMessage]);

      // Si un projet a été créé, proposer d'y aller
      if (response.data.project_id) {
        toast({
          title: "✨ Projet créé !",
          description: `${response.data.files_count} fichiers générés`,
          action: (
            <Button
              size="sm"
              onClick={() => navigate(`/project/${response.data.project_id}`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Voir le projet
            </Button>
          )
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Message d'erreur sympathique
      const errorMessage = {
        role: 'assistant',
        content: `Désolé, j'ai rencontré un petit problème ! 😅

Peux-tu reformuler ta demande ? Ou essaie de :
- Être plus précis dans ta description
- Me dire quel type de projet tu veux créer
- Me demander de l'aide sur quelque chose de spécifique

Je suis là pour t'aider ! 💪`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Réessaye !",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extraire juste le base64 sans le préfixe data:image/...;base64,
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const quickPrompts = [
    "Crée-moi une application web de gestion de tâches",
    "Comment créer un script Python pour automatiser Excel ?",
    "Aide-moi à créer une landing page moderne",
    "Crée une API REST avec FastAPI",
    "Je veux une application de calcul de budget"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
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
                  Assistant IA
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-400">En ligne</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <Card className={`p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : msg.isProgress
                        ? 'bg-purple-900/50 text-purple-200 border-purple-700 animate-pulse'
                        : 'bg-slate-800 text-slate-100 border-slate-700'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      
                      {/* Étapes de progression */}
                      {msg.progress && msg.progress.length > 0 && (
                        <div className="mt-3 space-y-1 border-t border-slate-700 pt-3">
                          <p className="text-xs font-semibold text-slate-400 mb-2">📋 Étapes :</p>
                          {msg.progress.map((step, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                              <span className="text-green-400">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fichiers créés */}
                      {msg.files_created && msg.files_created.length > 0 && (
                        <div className="mt-3 border-t border-slate-700 pt-3">
                          <p className="text-xs font-semibold text-slate-400 mb-2">📁 Fichiers créés :</p>
                          <div className="grid grid-cols-2 gap-1">
                            {msg.files_created.slice(0, 6).map((file, i) => (
                              <div key={i} className="flex items-center space-x-1 bg-slate-700/50 rounded px-2 py-1 text-xs">
                                <span className="text-green-400">✓</span>
                                <span className="truncate">{file}</span>
                              </div>
                            ))}
                          </div>
                          {msg.files_created.length > 6 && (
                            <p className="text-xs text-slate-500 mt-1">
                              +{msg.files_created.length - 6} autres fichiers
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Fichiers attachés */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.files.map((file, i) => (
                            <div key={i} className="flex items-center space-x-1 bg-slate-700 rounded px-2 py-1 text-xs">
                              <Paperclip className="w-3 h-3" />
                              <span>{file}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions si projet créé */}
                      {msg.project_created && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/project/${msg.project_created}`)}
                          className="mt-3 bg-purple-600 hover:bg-purple-700"
                        >
                          Voir le projet créé →
                        </Button>
                      )}
                    </Card>
                    <span className="text-xs text-slate-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <Card className="p-4 bg-slate-800 border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-sm text-slate-300">Je réfléchis...</span>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (si pas de messages encore) */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">💡 Suggestions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prompt)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Style Emergent */}
          <Card className="bg-slate-900 border-slate-700 p-4">
            {/* Fichiers attachés */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Zone de texte */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écris ta demande ici... (Shift+Enter pour nouvelle ligne)"
                  className="bg-slate-800 border-slate-700 text-white resize-none min-h-[80px] focus:border-purple-500"
                  disabled={isLoading}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col space-y-2">
                {/* Bouton fichier */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.doc,.docx,.py,.js,.json"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                {/* Bouton vocal */}
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={isLoading}
                  showTranscript={false}
                  buttonClassName="h-10 w-10"
                />

                {/* Bouton envoyer */}
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-[88px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Info text */}
            <p className="text-xs text-slate-500 mt-2 text-center">
              💡 Parle naturellement, je comprends le français ! • 🎤 Clique sur le micro pour parler • 📎 Ajoute des fichiers si besoin
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Mic, X, Send, Loader2, Volume2, StopCircle, Minimize2, Maximize2 } from 'lucide-react';
import VoiceInput from './VoiceInput';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * ASSISTANT VOCAL FLOTTANT - Style WhatsApp
 * Accessible depuis n'importe quelle page
 * Permet de contrôler l'application par la voix
 */
const FloatingVoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceTranscript = async (transcript) => {
    if (!transcript.trim()) return;

    // Ajouter le message utilisateur
    const userMessage = {
      role: 'user',
      content: transcript,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsProcessing(true);

    try {
      // Envoyer au backend pour traitement
      const response = await axios.post(`${BACKEND_URL}/api/chat/voice-command`, {
        voice_input: transcript
      });

      // Ajouter la réponse de l'assistant
      const assistantMessage = {
        role: 'assistant',
        content: response.data.confirmation || response.data.message || 'Commande reçue !',
        timestamp: new Date().toISOString(),
        data: response.data
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Parler la réponse (Text-to-Speech)
      if (response.data.confirmation) {
        speakText(response.data.confirmation);
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Désolé, je n\'ai pas compris. Pouvez-vous répéter ?',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  if (!isOpen) {
    // Bouton flottant principal
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 animate-pulse"
        >
          <Mic className="w-7 h-7 text-white" />
        </Button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full" />
      </div>
    );
  }

  if (isMinimized) {
    // Version minimisée
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="bg-slate-900 border-slate-700 p-3 shadow-2xl">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsMinimized(false)}
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Assistant Vocal</span>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Version complète
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="bg-slate-900 border-slate-700 shadow-2xl flex flex-col" style={{ height: '500px' }}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Assistant Vocal</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-slate-400">En ligne</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-slate-700" />
              <p className="text-sm font-semibold mb-2">Cliquez sur le micro et parlez !</p>
              <p className="text-xs">Je comprends vos commandes et j'exécute vos demandes</p>
              <div className="mt-4 text-xs text-slate-600 space-y-1">
                <p>Exemples :</p>
                <p>• "Crée un nouveau projet"</p>
                <p>• "Améliore le design"</p>
                <p>• "Ajoute une fonctionnalité de recherche"</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-slate-300">Traitement en cours...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer avec bouton vocal */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={isProcessing}
              showTranscript={false}
              buttonClassName="flex-1 h-12"
            />
            {messages.length > 0 && (
              <Button
                onClick={clearMessages}
                variant="outline"
                size="icon"
                className="border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Appuyez sur le micro et parlez
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FloatingVoiceAssistant;

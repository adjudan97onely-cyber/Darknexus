import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import VoiceInput from './VoiceInput';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatBot = ({ projectId, onCodeUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`${API}/chat/history/${projectId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Ajouter le message utilisateur immédiatement
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMsg]);

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat/message`, {
        project_id: projectId,
        message: userMessage
      });

      // Ajouter la réponse de l'IA
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: response.data.timestamp
      };
      setMessages(prev => [...prev, aiMessage]);

      // Si l'IA a modifié le code, notifier le parent
      if (onCodeUpdate && response.data.code_updated) {
        onCodeUpdate();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "Améliorer le design", icon: "✨", prompt: "Améliore le design de l'application avec des animations et des couleurs modernes" },
    { label: "Ajouter fonctionnalité", icon: "➕", prompt: "Je veux ajouter une nouvelle fonctionnalité : " },
    { label: "Corriger bugs", icon: "🐛", prompt: "Analyse le code et corrige tous les bugs potentiels" },
    { label: "Optimiser", icon: "⚡", prompt: "Optimise les performances et la vitesse de l'application" }
  ];

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Assistant IA</h3>
            <p className="text-sm text-slate-400">Prêt à vous aider</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-8">
            <Bot className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-lg font-semibold mb-2">Commencez la conversation !</p>
            <p className="text-sm">Demandez-moi d'améliorer, modifier ou corriger votre projet</p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6 max-w-md mx-auto">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => setInput(action.prompt)}
                  className="border-slate-700 hover:bg-slate-800 text-left h-auto py-3"
                >
                  <span className="mr-2 text-xl">{action.icon}</span>
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <Card className={`p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-slate-800 text-slate-100 border-slate-700'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="p-3 bg-slate-800 border-slate-700">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-slate-300">L'IA réfléchit...</span>
                </div>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Demandez n'importe quoi : améliorer, modifier, corriger, ajouter..."
              className="bg-slate-800 border-slate-700 text-white resize-none min-h-[60px]"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

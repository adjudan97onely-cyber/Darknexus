import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Sparkles, Send, Loader2, User, Bot } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

export default function AssistantV2Page() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bienvenue sur Assistant IA N2. Envoie un prompt pour tester le pipeline V2 en parallele.'
    }
  ]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/assistant-v2`, {
        message: prompt,
        conversation_history: messages.slice(-8)
      });

      const data = response.data || {};
      const aiText = data.response || data.message || 'Reponse recue, mais format inattendu.';

      setMessages((prev) => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      const details = error?.response?.data?.detail || 'Impossible de contacter Assistant IA N2.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur: ${details}` }]);
      toast({
        title: 'Assistant N2 indisponible',
        description: 'Verifie que le backend est demarre sur le port 5000.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                Assistant IA N2
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400">Mode parallele V2</span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="bg-slate-900/60 border-slate-800 p-4 mb-4">
          <p className="text-sm text-slate-300">
            Cette page teste le nouvel endpoint V2 sans impacter l\'assistant historique.
          </p>
        </Card>

        <div className="space-y-3 mb-4 max-h-[56vh] overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card
                className={`max-w-[85%] p-3 border ${
                  msg.role === 'user'
                    ? 'bg-blue-600/30 border-blue-500/40'
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 mt-1 text-blue-300" />
                  ) : (
                    <Bot className="w-4 h-4 mt-1 text-fuchsia-300" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <Card className="bg-slate-900/70 border-slate-800 p-3">
          <div className="flex flex-col gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Decris ta demande pour Assistant IA N2..."
              className="min-h-[110px] bg-slate-950 border-slate-700 text-slate-100"
            />
            <div className="flex justify-end">
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Envoyer a N2
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

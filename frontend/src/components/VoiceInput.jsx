import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const VoiceInput = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si le navigateur supporte Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    // Initialiser la reconnaissance vocale
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Enregistrement continu
    recognition.interimResults = true; // Résultats intermédiaires
    recognition.lang = 'fr-FR'; // Français
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎤 Écoute en cours...",
        description: "Parlez maintenant pour décrire votre projet"
      });
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast({
          title: "Aucune voix détectée",
          description: "Parlez plus fort ou vérifiez votre microphone",
          variant: "destructive"
        });
      } else if (event.error === 'not-allowed') {
        toast({
          title: "Accès micro refusé",
          description: "Autorisez l'accès au microphone dans les paramètres du navigateur",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur d'enregistrement",
          description: event.error,
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      toast({
        title: "⏸️ Enregistrement arrêté",
        description: "Vous pouvez éditer le texte ou recommencer"
      });
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-slate-500 italic">
        Votre navigateur ne supporte pas la dictée vocale
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleListening}
      disabled={disabled}
      className={`transition-all duration-300 ${
        isListening 
          ? 'bg-red-600 hover:bg-red-700 animate-pulse border-red-500' 
          : 'border-slate-700 hover:bg-slate-800 hover:border-purple-500'
      }`}
      title={isListening ? "Arrêter l'enregistrement" : "Commencer la dictée vocale"}
    >
      {isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5 text-slate-300" />
      )}
    </Button>
  );
};

export default VoiceInput;

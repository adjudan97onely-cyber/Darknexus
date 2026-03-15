import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';

const VoiceInput = ({ onTranscript, disabled = false, showTranscript = false, mode = 'live' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [recordedTranscript, setRecordedTranscript] = useState(''); // Pour le mode "record-then-send"
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
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
      console.log('🎤 Reconnaissance vocale démarrée');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      // Mettre à jour la transcription intermédiaire pour l'affichage
      setInterimTranscript(interim);

      // Si on a du texte final, l'ajouter à la transcription complète
      if (final) {
        setFullTranscript(prev => {
          const newTranscript = prev + final;
          
          // MODE LIVE : Envoyer immédiatement au parent
          if (mode === 'live') {
            onTranscript(newTranscript.trim());
          }
          // MODE RECORD : Stocker localement, envoyer seulement à l'arrêt
          else if (mode === 'record') {
            setRecordedTranscript(newTranscript.trim());
          }
          
          return newTranscript;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      
      // Ne pas arrêter sur "no-speech" - juste continuer d'écouter
      if (event.error === 'no-speech') {
        console.log('Aucune voix détectée, mais on continue d\'écouter...');
        return;
      }
      
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Accès micro refusé",
          description: "Autorisez l'accès au microphone dans les paramètres du navigateur",
          variant: "destructive"
        });
      } else if (event.error !== 'aborted') {
        toast({
          title: "Erreur d'enregistrement",
          description: event.error,
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      console.log('🛑 Reconnaissance vocale terminée');
      
      // Si on était en train d'écouter et que ça s'arrête, redémarrer automatiquement
      if (isListening && recognitionRef.current) {
        console.log('🔄 Redémarrage automatique...');
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (error) {
            console.error('Erreur lors du redémarrage:', error);
            setIsListening(false);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Erreur lors de l\'arrêt:', error);
        }
      }
    };
  }, [onTranscript, toast, isListening]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    try {
      // Réinitialiser les transcriptions
      setFullTranscript('');
      setInterimTranscript('');
      
      recognitionRef.current.start();
      
      toast({
        title: "🎤 Enregistrement en cours...",
        description: mode === 'record' 
          ? "Parlez librement ! Le texte apparaîtra quand vous arrêterez." 
          : "Parlez maintenant ! Cliquez à nouveau pour arrêter."
      });
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'enregistrement",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    setIsListening(false);
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    try {
      recognitionRef.current.stop();
      
      // MODE RECORD : Envoyer la transcription complète au parent MAINTENANT !
      if (mode === 'record' && recordedTranscript) {
        onTranscript(recordedTranscript);
        
        toast({
          title: "✅ Transcription terminée !",
          description: `${recordedTranscript.split(' ').length} mots capturés`
        });
      } else {
        toast({
          title: "⏸️ Enregistrement arrêté",
          description: fullTranscript ? "Transcription terminée !" : "Aucun texte capturé"
        });
      }

      // Réinitialiser après l'arrêt
      setTimeout(() => {
        setInterimTranscript('');
        setFullTranscript('');
        setRecordedTranscript('');
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt:', error);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
          title={isListening 
            ? (mode === 'record' ? "Arrêter et transcrire" : "Arrêter l'enregistrement")
            : (mode === 'record' ? "Enregistrer puis transcrire" : "Commencer la dictée vocale")
          }
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5 text-slate-300" />
          )}
        </Button>
        {isListening && (
          <Badge variant="destructive" className="animate-pulse">
            🔴 En cours d'écoute...
          </Badge>
        )}
      </div>
      
      {/* Affichage en temps réel de la transcription si demandé */}
      {showTranscript && isListening && (fullTranscript || interimTranscript) && (
        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Transcription en direct :</p>
          <p className="text-sm text-white">
            {fullTranscript}
            <span className="text-slate-400 italic">{interimTranscript}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

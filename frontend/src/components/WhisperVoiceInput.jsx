import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import api from '../services/axiosConfig';

const WhisperVoiceInput = ({ onTranscript, disabled = false, showTranscript = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { toast } = useToast();

  React.useEffect(() => {
    // Vérifier si le navigateur supporte MediaRecorder
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = async () => {
    try {
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Créer le MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Arrêter tous les tracks audio
        stream.getTracks().forEach(track => track.stop());
        
        // Créer le blob audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Envoyer à Whisper pour transcription
        await transcribeAudio(audioBlob);
      };

      // Démarrer l'enregistrement
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "🎤 Enregistrement en cours...",
        description: "Parlez naturellement ! Comme avec Emergent 🔥"
      });

    } catch (error) {
      console.error('Erreur microphone:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "❌ Accès micro refusé",
          description: "Autorisez l'accès au microphone dans les paramètres",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Erreur",
          description: "Impossible d'accéder au microphone",
          variant: "destructive"
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      // Créer FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Envoyer à l'API Whisper
      const response = await api.post(`/api/whisper/transcribe`, formData);

      if (response.data.success) {
        const transcribedText = response.data.text;
        
        // Envoyer le texte au parent
        onTranscript(transcribedText);
        
        toast({
          title: "✅ Transcription réussie !",
          description: `${transcribedText.split(' ').length} mots capturés avec Whisper 🔥`
        });
      } else {
        throw new Error('Transcription échouée');
      }

    } catch (error) {
      console.error('Erreur transcription:', error);
      toast({
        title: "❌ Erreur de transcription",
        description: error.response?.data?.detail || "Réessayez",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-slate-500 italic">
        Votre navigateur ne supporte pas l'enregistrement audio
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled || isTranscribing}
        className={`transition-all duration-300 ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse border-red-500' 
            : 'border-slate-700 hover:bg-slate-800 hover:border-purple-500'
        }`}
        title={isRecording ? "Arrêter et transcrire" : "Enregistrer avec Whisper"}
      >
        {isTranscribing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5 text-slate-300" />
        )}
      </Button>
      
      {isRecording && (
        <Badge variant="destructive" className="animate-pulse">
          🔴 En cours...
        </Badge>
      )}
      
      {isTranscribing && (
        <Badge className="bg-purple-600">
          ✨ Transcription Whisper...
        </Badge>
      )}
    </div>
  );
};

export default WhisperVoiceInput;

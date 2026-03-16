"""
WHISPER STT ROUTE
Route pour la transcription audio avec OpenAI Whisper (ultra fluide)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from emergentintegrations.llm.openai import OpenAISpeechToText
import os
from dotenv import load_dotenv
import logging
import tempfile

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whisper", tags=["whisper"])

# Initialiser Whisper avec la clé OpenAI perso ou Emergent
stt = OpenAISpeechToText(api_key=os.getenv("OPENAI_API_KEY") or os.getenv("EMERGENT_LLM_KEY"))


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcrit un fichier audio en texte avec OpenAI Whisper
    Ultra fluide comme Emergent !
    """
    try:
        logger.info(f"Transcription request received: {audio.filename}")
        
        # Vérifier le format du fichier
        allowed_formats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
        file_extension = audio.filename.split('.')[-1].lower()
        
        if file_extension not in allowed_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Format non supporté. Formats acceptés: {', '.join(allowed_formats)}"
            )
        
        # Vérifier la taille (max 25MB)
        content = await audio.read()
        if len(content) > 25 * 1024 * 1024:  # 25MB
            raise HTTPException(
                status_code=400,
                detail="Fichier trop volumineux (max 25MB)"
            )
        
        # Créer un fichier temporaire pour Whisper
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Transcrire avec Whisper
            with open(tmp_file_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="json",
                    language="fr",  # Français par défaut
                    temperature=0.0  # Déterministe
                )
            
            logger.info(f"Transcription successful: {len(response.text)} characters")
            
            return {
                "success": True,
                "text": response.text,
                "model": "whisper-1",
                "language": "fr"
            }
            
        finally:
            # Nettoyer le fichier temporaire
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de transcription: {str(e)}"
        )

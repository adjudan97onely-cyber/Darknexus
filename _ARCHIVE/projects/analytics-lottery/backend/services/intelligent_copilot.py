"""
COPILOTE INTELLIGENT - Dark Nexus AI 2042
Assistant contextualisé qui connaît parfaitement l'application et aide l'utilisateur
à créer des projets de manière optimale et économique
"""

import os
import json
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)


class IntelligentCopilot:
    """
    Copilote intelligent qui :
    1. Analyse les demandes de l'utilisateur
    2. Choisit automatiquement le meilleur modèle (économie + qualité)
    3. Génère des descriptions optimales
    4. Estime les coûts
    5. Répond aux questions sur Dark Nexus AI
    """
    
    # Contexte complet de Dark Nexus AI
    DARK_NEXUS_CONTEXT = """
Tu es le COPILOTE INTELLIGENT de Dark Nexus AI 2042, une application de génération de code IA.

# TON RÔLE :
- Analyser les demandes de l'utilisateur avec intelligence
- Choisir automatiquement le BON modèle (économie + qualité)
- Générer des descriptions de projet optimales
- Estimer les coûts AVANT génération
- Répondre à TOUTES les questions sur Dark Nexus AI

# MODÈLES DISPONIBLES DANS DARK NEXUS AI :

## gpt-4.1-nano (ÉCONOMIQUE - Tests/Prototypes)
- Coût : ~$0.03 par application
- Usage : Tests, prototypes simples, apprentissage
- Qualité : Correcte pour des projets basiques
- Quand l'utiliser : Apps simples (todo, compteur, formulaire basique)

## gpt-4.1-mini (RECOMMANDÉ - Équilibré)
- Coût : ~$0.10 par application
- Usage : 80% des projets (apps moyennes)
- Qualité : Très bonne, fiable
- Quand l'utiliser : Apps standard (CRUD, dashboards, apps de gestion)
- C'EST LE MEILLEUR COMPROMIS QUALITÉ/PRIX !

## gpt-4.1 (PREMIUM - Projets complexes)
- Coût : ~$0.40 par application
- Usage : Projets complexes et critiques
- Qualité : Excellente, la meilleure
- Quand l'utiliser : Apps complexes (temps réel, ML, gaming, finance)

## gpt-5.1 (ALTERNATIF)
- Similaire à gpt-4.1 en performance
- Usage : Fallback si gpt-4.1 échoue

# TYPES DE PROJETS SUPPORTÉS :
- Web App (React, Vue, Angular)
- API REST (FastAPI, Express, Django)
- Mobile App (React Native, Flutter)
- Bot (Discord, Telegram)
- PWA (Progressive Web App)
- Script d'automatisation
- Extension Chrome
- AI Agent

# STACK TECHNIQUES POPULAIRES :
- Frontend : React, Vue, Angular, Svelte
- Backend : FastAPI, Express, Django, Flask
- Database : MongoDB, PostgreSQL, Firebase
- Styling : Tailwind CSS, Material UI, Bootstrap

# TON WORKFLOW INTELLIGENT :

Quand l'utilisateur demande une app, tu dois :

1. ANALYSER la complexité :
   - Simple (CRUD basique, formulaire) → gpt-4.1-nano ou mini
   - Moyen (dashboard, app de gestion) → gpt-4.1-mini
   - Complexe (temps réel, prédictions, gaming) → gpt-4.1

2. GÉNÉRER une description optimale avec :
   - Nom du projet clair
   - Liste précise des fonctionnalités
   - Stack technique recommandé
   - Type de projet

3. ESTIMER le coût :
   - gpt-4.1-nano : $0.03
   - gpt-4.1-mini : $0.10
   - gpt-4.1 : $0.40

4. PRÉSENTER tout clairement :
   ```
   🎯 ANALYSE DE TON PROJET :
   
   Complexité : [Simple/Moyen/Complexe]
   Modèle recommandé : [nom du modèle]
   
   📝 DESCRIPTION OPTIMALE :
   [description détaillée]
   
   🛠️ STACK RECOMMANDÉ :
   - Frontend : [techno]
   - Backend : [techno]
   - Database : [techno]
   
   💰 COÛT ESTIMÉ : ~$[montant]
   
   ✅ Tu valides et je génère ?
   ```

# EXEMPLES DE RÉPONSES INTELLIGENTES :

Utilisateur : "app de keno"
Toi : 
```
🎯 ANALYSE DE TON PROJET :

Complexité : Complexe (prédictions temps réel, statistiques)
Modèle recommandé : gpt-4.1 (qualité maximale nécessaire)

📝 DESCRIPTION OPTIMALE :
"Application de prédictions Keno avec :
- Analyse des sorties de numéros en temps réel
- Historique des 100 derniers tirages
- Statistiques et calculs de probabilités
- Suggestions de paris basées sur les patterns
- Interface de suivi des gains/pertes
- Notifications push pour numéros chauds/froids"

🛠️ STACK RECOMMANDÉ :
- Frontend : React + Tailwind CSS (interface réactive)
- Backend : Node.js + Express (API temps réel)
- Database : MongoDB (stockage historique)
- Websockets : Socket.io (données temps réel)

💰 COÛT ESTIMÉ : ~$0.40

✅ Tu valides et je génère ?
❌ Tu veux économiser ? (je peux adapter pour gpt-4.1-mini à $0.10)
```

Utilisateur : "app todo liste"
Toi :
```
🎯 ANALYSE DE TON PROJET :

Complexité : Simple (CRUD basique)
Modèle recommandé : gpt-4.1-nano (parfait pour ça !)

📝 DESCRIPTION OPTIMALE :
"Application Todo Liste simple avec :
- Ajouter/modifier/supprimer des tâches
- Marquer comme complété
- Filtrer par statut (tout/actif/complété)
- Persistence locale (localStorage)
- Design moderne et responsive"

🛠️ STACK RECOMMANDÉ :
- Frontend : React + Tailwind CSS
- State : React Hooks (useState, useEffect)
- Storage : localStorage (pas de backend nécessaire)

💰 COÛT ESTIMÉ : ~$0.03 (ultra économique !)

✅ Je génère direct ?
```

# RÈGLES IMPORTANTES :

1. TOUJOURS analyser la complexité AVANT de recommander un modèle
2. PRIVILÉGIER l'économie : gpt-4.1-mini par défaut, gpt-4.1 seulement si vraiment nécessaire
3. GÉNÉRER des descriptions DÉTAILLÉES (plus de détails = meilleur code)
4. ESTIMER le coût TOUJOURS
5. RÉPONDRE en français, ton amical et professionnel
6. SI l'utilisateur pose une question sur Dark Nexus AI → répondre avec précision
7. SI l'utilisateur veut économiser → proposer un modèle moins cher

# QUESTIONS FRÉQUENTES À ANTICIPER :

Q : "Quel modèle utiliser pour [type de projet] ?"
A : Analyser et recommander selon la complexité

Q : "Combien ça coûte ?"
A : Donner le coût estimé selon le modèle

Q : "Comment économiser ?"
A : Expliquer : descriptions détaillées, bon modèle, pas de spam

Q : "Pourquoi ça a échoué ?"
A : Vérifier budget OpenAI, description vague, modèle inadapté

TU ES UN EXPERT, PAS UN CHATBOT BASIQUE !
"""

    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY or EMERGENT_LLM_KEY required")
    
    async def analyze_and_recommend(
        self, 
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Analyse la demande de l'utilisateur et recommande le meilleur plan d'action
        
        Returns:
            Dict avec :
            - response : Réponse textuelle du copilote
            - recommended_model : Modèle recommandé (si applicable)
            - estimated_cost : Coût estimé (si applicable)
            - project_description : Description générée (si applicable)
            - project_name : Nom suggéré (si applicable)
            - stack : Stack technique recommandé (si applicable)
        """
        try:
            # Préparer l'historique de conversation
            messages = []
            if conversation_history:
                for msg in conversation_history:
                    messages.append({
                        'role': msg.get('role', 'user'),
                        'content': msg.get('content', '')
                    })
            
            # Ajouter le message actuel
            messages.append({'role': 'user', 'content': user_message})
            
            # Appeler le LLM avec le contexte Dark Nexus AI
            llm = LlmChat(
                api_key=self.api_key,
                model='gpt-4.1-mini',  # On utilise mini pour le copilote lui-même (économie)
                temperature=0.7,
                system_prompt=self.DARK_NEXUS_CONTEXT
            )
            
            response = await llm.generate_response_async(messages)
            
            # Parser la réponse pour extraire les infos structurées
            response_text = response.message
            
            # Essayer d'extraire les infos structurées de la réponse
            result = {
                'response': response_text,
                'recommended_model': self._extract_recommended_model(response_text),
                'estimated_cost': self._extract_estimated_cost(response_text),
                'project_description': self._extract_project_description(response_text),
                'project_name': self._extract_project_name(response_text),
                'stack': self._extract_stack(response_text)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur copilote intelligent : {str(e)}")
            return {
                'response': f"Désolé, j'ai rencontré une erreur : {str(e)}. Peux-tu reformuler ta demande ?",
                'recommended_model': None,
                'estimated_cost': None,
                'project_description': None,
                'project_name': None,
                'stack': None
            }
    
    def _extract_recommended_model(self, text: str) -> Optional[str]:
        """Extrait le modèle recommandé de la réponse"""
        models = ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-5.1']
        for model in models:
            if model in text.lower():
                return model
        return None
    
    def _extract_estimated_cost(self, text: str) -> Optional[float]:
        """Extrait le coût estimé de la réponse"""
        import re
        match = re.search(r'\$(\d+\.\d+)', text)
        if match:
            return float(match.group(1))
        return None
    
    def _extract_project_description(self, text: str) -> Optional[str]:
        """Extrait la description du projet de la réponse"""
        import re
        match = re.search(r'📝 DESCRIPTION OPTIMALE :\s*"([^"]+)"', text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None
    
    def _extract_project_name(self, text: str) -> Optional[str]:
        """Extrait le nom du projet suggéré"""
        import re
        match = re.search(r'Application (?:de |d\')?([^\n]+)', text)
        if match:
            return match.group(1).strip()
        return None
    
    def _extract_stack(self, text: str) -> Optional[Dict[str, str]]:
        """Extrait la stack technique recommandée"""
        import re
        stack = {}
        
        # Chercher Frontend
        frontend_match = re.search(r'Frontend\s*:\s*([^\n]+)', text)
        if frontend_match:
            stack['frontend'] = frontend_match.group(1).strip()
        
        # Chercher Backend
        backend_match = re.search(r'Backend\s*:\s*([^\n]+)', text)
        if backend_match:
            stack['backend'] = backend_match.group(1).strip()
        
        # Chercher Database
        db_match = re.search(r'Database\s*:\s*([^\n]+)', text)
        if db_match:
            stack['database'] = db_match.group(1).strip()
        
        return stack if stack else None


# Instance globale
intelligent_copilot = IntelligentCopilot()

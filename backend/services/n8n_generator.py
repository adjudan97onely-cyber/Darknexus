"""
N8N WORKFLOW GENERATOR - Génère des workflows n8n automatiquement
Permet à l'assistant de créer des automatisations n8n
"""

import logging
from typing import Dict, Any, List
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json

logger = logging.getLogger(__name__)


class N8NWorkflowGenerator:
    """
    Génère des workflows n8n basés sur des descriptions en langage naturel
    """
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    async def generate_workflow(self, description: str, use_case: str = None) -> Dict[str, Any]:
        """
        Génère un workflow n8n complet
        
        Args:
            description: Description de l'automatisation souhaitée
            use_case: Cas d'usage spécifique (ex: "facture_ocr", "email_automation")
            
        Returns:
            Dict avec le workflow JSON et les instructions
        """
        try:
            chat = LlmChat(api_key=self.api_key, session_id="n8n_gen")
            chat.with_model("openai", "gpt-5.1")
            
            prompt = f"""Tu es un expert n8n. Génère un workflow n8n complet pour :

DESCRIPTION : {description}
{f"CAS D'USAGE : {use_case}" if use_case else ""}

Crée un workflow n8n avec :
1. Tous les nodes nécessaires
2. Les connexions entre nodes
3. Les configurations de chaque node

Format de réponse :

📋 **WORKFLOW N8N À COPIER-COLLER**

**Nom du workflow** : [nom descriptif]

**Description** : [ce que fait le workflow]

**Nodes nécessaires** :
- Node 1 : [type] - [fonction]
- Node 2 : [type] - [fonction]
- etc.

**JSON du workflow** :
```json
{{
  "name": "[nom]",
  "nodes": [
    {{
      "parameters": {{}},
      "name": "[nom node]",
      "type": "[type]",
      "typeVersion": 1,
      "position": [x, y]
    }}
  ],
  "connections": {{}}
}}
```

**Instructions d'installation** :
1. Copie le JSON ci-dessus
2. Va dans n8n → Import from JSON
3. Colle le JSON
4. Configure les credentials si nécessaire
5. Active le workflow !

**Prérequis** :
- [Liste des credentials nécessaires]
- [Autres prérequis]

**Conseils** :
- [Conseils d'utilisation]

Sois précis et fournis un workflow FONCTIONNEL !"""

            response = await chat.send_message(UserMessage(text=prompt))
            
            return {
                'success': True,
                'workflow': response,
                'description': description,
                'use_case': use_case
            }
            
        except Exception as e:
            logger.error(f"Error generating n8n workflow: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'workflow': "Impossible de générer le workflow pour le moment."
            }
    
    async def generate_specific_workflow(self, workflow_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Génère des workflows prédéfinis pour des cas d'usage courants
        """
        
        templates = {
            'facture_ocr': self._template_facture_ocr,
            'email_automation': self._template_email,
            'webhook_trigger': self._template_webhook,
            'scheduled_task': self._template_schedule,
            'api_integration': self._template_api
        }
        
        if workflow_type in templates:
            return await templates[workflow_type](params)
        else:
            return await self.generate_workflow(f"Workflow de type {workflow_type} avec paramètres {params}")
    
    async def _template_facture_ocr(self, params: Dict) -> Dict[str, Any]:
        """Template pour extraction de données de factures"""
        description = """Workflow pour extraire les données d'une facture :
1. Réception d'une image de facture (webhook ou email)
2. OCR avec Vision AI (GPT-5.1 Vision ou Google Cloud Vision)
3. Extraction : nom, adresse, articles, quantités, prix, poids
4. Calcul automatique des totaux
5. Création d'une feuille Excel
6. Envoi par email ou stockage"""
        
        return await self.generate_workflow(description, "facture_ocr")
    
    async def _template_email(self, params: Dict) -> Dict[str, Any]:
        """Template pour automatisation email"""
        return await self.generate_workflow("Automatisation d'emails", "email_automation")
    
    async def _template_webhook(self, params: Dict) -> Dict[str, Any]:
        """Template pour webhook"""
        return await self.generate_workflow("Webhook trigger", "webhook_trigger")
    
    async def _template_schedule(self, params: Dict) -> Dict[str, Any]:
        """Template pour tâches planifiées"""
        return await self.generate_workflow("Tâche planifiée", "scheduled_task")
    
    async def _template_api(self, params: Dict) -> Dict[str, Any]:
        """Template pour intégration API"""
        return await self.generate_workflow("Intégration API", "api_integration")


# Instance globale
n8n_generator = N8NWorkflowGenerator()

"""
VOICE COMMANDS HANDLER
Gestionnaire intelligent de commandes vocales pour contrôler l'application
"""

import re
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class VoiceCommandsHandler:
    """
    Analyse les commandes vocales et les transforme en actions concrètes
    """
    
    def __init__(self):
        # Patterns de commandes vocales
        self.command_patterns = {
            # Modification du projet
            'change_title': [
                r'modifi[eé]r?\s+(?:le\s+)?titre',
                r'chang[eé]r?\s+(?:le\s+)?titre',
                r'renomm[eé]r?\s+(?:le\s+)?projet'
            ],
            'change_description': [
                r'modifi[eé]r?\s+(?:la\s+)?description',
                r'chang[eé]r?\s+(?:la\s+)?description'
            ],
            'change_type': [
                r'modifi[eé]r?\s+(?:le\s+)?type\s+(?:de\s+)?projet',
                r'chang[eé]r?\s+(?:le\s+)?type'
            ],
            
            # Amélioration du projet
            'improve_design': [
                r'amélior[eé]r?\s+(?:le\s+)?design',
                r'embellir',
                r'rendre\s+plus\s+joli'
            ],
            'improve_performance': [
                r'optimis[eé]r?',
                r'amélior[eé]r?\s+(?:les\s+)?performances',
                r'rendre\s+plus\s+rapide'
            ],
            'add_feature': [
                r'ajout[eé]r?\s+(?:une\s+)?fonctionnalité',
                r'ajout[eé]r?\s+(?:une\s+)?feature',
                r'(?:je\s+)?veux\s+ajouter'
            ],
            
            # Debug et correction
            'fix_bugs': [
                r'corrig[eé]r?\s+(?:les\s+)?bugs',
                r'réparer',
                r'fix[eé]r?'
            ],
            
            # Navigation
            'go_home': [
                r'retourn[eé]r?\s+(?:à\s+)?l\'accueil',
                r'page\s+d\'accueil',
                r'menu\s+principal'
            ],
            'create_project': [
                r'créer\s+(?:un\s+)?(?:nouveau\s+)?projet',
                r'nouveau\s+projet'
            ],
            
            # Génération
            'generate_code': [
                r'génér[eé]r?\s+(?:le\s+)?code',
                r'créer\s+le\s+code',
                r'lancer\s+(?:la\s+)?génération'
            ],
            
            # Actions générales
            'help': [
                r'aide',
                r'qu\'est-ce\s+que\s+tu\s+peux\s+faire',
                r'commandes\s+disponibles'
            ]
        }
    
    def parse_command(self, voice_input: str) -> Dict[str, Any]:
        """
        Parse une commande vocale et retourne l'action à effectuer
        
        Args:
            voice_input: Texte de la commande vocale
            
        Returns:
            Dict contenant l'action et les paramètres
        """
        voice_input = voice_input.lower().strip()
        
        # Détecter le type de commande
        command_type = self._detect_command_type(voice_input)
        
        if not command_type:
            # Pas de commande détectée, c'est une requête normale
            return {
                'type': 'chat',
                'action': 'send_message',
                'message': voice_input,
                'is_command': False
            }
        
        # Extraire les paramètres de la commande
        params = self._extract_parameters(voice_input, command_type)
        
        return {
            'type': 'command',
            'action': command_type,
            'params': params,
            'is_command': True,
            'original_text': voice_input
        }
    
    def _detect_command_type(self, text: str) -> Optional[str]:
        """Détecte le type de commande dans le texte"""
        for command_type, patterns in self.command_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return command_type
        return None
    
    def _extract_parameters(self, text: str, command_type: str) -> Dict[str, Any]:
        """Extrait les paramètres d'une commande"""
        params = {}
        
        if command_type == 'change_title':
            # Extraire le nouveau titre
            # Ex: "modifie le titre en Mon Super Projet"
            match = re.search(r'(?:en|par|à)\s+(.+)', text, re.IGNORECASE)
            if match:
                params['new_title'] = match.group(1).strip()
        
        elif command_type == 'change_description':
            # Extraire la nouvelle description
            match = re.search(r'(?:en|par|à)\s+(.+)', text, re.IGNORECASE)
            if match:
                params['new_description'] = match.group(1).strip()
        
        elif command_type == 'add_feature':
            # Extraire la fonctionnalité à ajouter
            match = re.search(r'ajouter\s+(.+)', text, re.IGNORECASE)
            if match:
                params['feature_description'] = match.group(1).strip()
        
        return params
    
    def get_available_commands(self) -> List[Dict[str, str]]:
        """Retourne la liste des commandes disponibles"""
        return [
            {
                'command': 'Modifier le titre',
                'example': 'Modifie le titre en Mon Super Projet',
                'action': 'change_title'
            },
            {
                'command': 'Modifier la description',
                'example': 'Change la description en Une super application',
                'action': 'change_description'
            },
            {
                'command': 'Améliorer le design',
                'example': 'Améliore le design de l\'application',
                'action': 'improve_design'
            },
            {
                'command': 'Optimiser les performances',
                'example': 'Optimise le code pour qu\'il soit plus rapide',
                'action': 'improve_performance'
            },
            {
                'command': 'Ajouter une fonctionnalité',
                'example': 'Ajoute une fonctionnalité de recherche',
                'action': 'add_feature'
            },
            {
                'command': 'Corriger les bugs',
                'example': 'Corrige tous les bugs du projet',
                'action': 'fix_bugs'
            },
            {
                'command': 'Créer un nouveau projet',
                'example': 'Créer un nouveau projet',
                'action': 'create_project'
            },
            {
                'command': 'Générer le code',
                'example': 'Génère le code maintenant',
                'action': 'generate_code'
            }
        ]


# Instance globale
voice_commands_handler = VoiceCommandsHandler()


def parse_voice_command(voice_input: str) -> Dict[str, Any]:
    """
    Parse une commande vocale
    
    Args:
        voice_input: Texte de la commande vocale
        
    Returns:
        Dict avec l'action à effectuer
    """
    return voice_commands_handler.parse_command(voice_input)


def get_voice_commands_list() -> List[Dict[str, str]]:
    """Retourne la liste des commandes vocales disponibles"""
    return voice_commands_handler.get_available_commands()

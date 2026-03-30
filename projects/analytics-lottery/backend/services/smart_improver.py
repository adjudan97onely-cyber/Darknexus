"""
SERVICE D'AMÉLIORATION INTELLIGENTE (NIVEAU E5)
Mode "patch" : analyse le code existant et applique uniquement les changements nécessaires
Ne régénère PAS tout le projet
"""

import logging
from typing import Dict, Any, List, Optional
import json
import re

logger = logging.getLogger(__name__)


class SmartImprover:
    """Amélioration intelligente en mode patch (pas de régénération complète)"""
    
    def __init__(self):
        self.improvement_strategies = {
            'add_feature': 'Ajouter une nouvelle fonctionnalité sans toucher au reste',
            'fix_bug': 'Corriger un bug spécifique',
            'optimize': 'Optimiser le code existant',
            'refactor': 'Refactoriser pour améliorer la qualité',
            'style': 'Améliorer le design/UI',
            'accessibility': 'Améliorer l\'accessibilité'
        }
    
    def analyze_improvement_request(self, description: str) -> Dict[str, Any]:
        """
        Analyse la demande d'amélioration et détermine la stratégie
        
        Returns:
            Dict avec type d'amélioration et fichiers potentiellement affectés
        """
        description_lower = description.lower()
        
        # Déterminer le type d'amélioration
        improvement_type = 'general'
        
        if any(kw in description_lower for kw in ['ajoute', 'add', 'nouveau', 'new', 'créer', 'create']):
            improvement_type = 'add_feature'
        elif any(kw in description_lower for kw in ['corrige', 'fix', 'bug', 'erreur', 'error']):
            improvement_type = 'fix_bug'
        elif any(kw in description_lower for kw in ['optimise', 'optimize', 'performance', 'rapide', 'fast']):
            improvement_type = 'optimize'
        elif any(kw in description_lower for kw in ['design', 'style', 'couleur', 'color', 'ui', 'interface']):
            improvement_type = 'style'
        elif any(kw in description_lower for kw in ['mode sombre', 'dark mode', 'thème', 'theme']):
            improvement_type = 'style'
            description += "\n\nAjouter un système de thème clair/sombre avec toggle"
        
        # Déterminer les fichiers potentiellement affectés
        affected_files = []
        
        if 'style' in description_lower or 'css' in description_lower or 'tailwind' in description_lower:
            affected_files.extend(['src/App.jsx', 'src/index.css', 'tailwind.config.js'])
        
        if 'component' in description_lower:
            # Extraire le nom du composant si mentionné
            component_match = re.search(r'composant\s+(\w+)|component\s+(\w+)', description_lower)
            if component_match:
                comp_name = component_match.group(1) or component_match.group(2)
                affected_files.append(f'src/components/{comp_name}.jsx')
        
        if 'api' in description_lower or 'backend' in description_lower or 'server' in description_lower:
            affected_files.extend(['src/services/api.js', 'src/App.jsx'])
        
        logger.info(f"📊 Analyse: type={improvement_type}, fichiers={len(affected_files)}")
        
        return {
            'type': improvement_type,
            'strategy': self.improvement_strategies.get(improvement_type, 'Amélioration générale'),
            'affected_files': affected_files,
            'requires_full_regeneration': improvement_type in ['general', 'refactor']
        }
    
    def build_smart_prompt(
        self,
        improvement_description: str,
        project_data: Dict[str, Any],
        existing_files: List[Dict[str, Any]],
        analysis: Dict[str, Any]
    ) -> str:
        """
        Construit un prompt intelligent pour l'amélioration en mode patch
        """
        improvement_type = analysis['type']
        affected_files = analysis['affected_files']
        
        # Construire le contexte des fichiers existants
        files_context = ""
        if len(affected_files) > 0:
            # Ne montrer que les fichiers affectés
            relevant_files = [f for f in existing_files if f['filename'] in affected_files]
            if len(relevant_files) > 0:
                files_context = "\n\n=== FICHIERS EXISTANTS À MODIFIER ===\n"
                for file in relevant_files[:3]:  # Max 3 fichiers pour ne pas surcharger
                    files_context += f"\n--- {file['filename']} ---\n{file['content'][:1000]}...\n"
        else:
            # Montrer un résumé de tous les fichiers
            files_context = "\n\n=== STRUCTURE DU PROJET ===\n"
            files_context += "\n".join([f"- {f['filename']}" for f in existing_files[:10]])
        
        # Construire le prompt selon le type d'amélioration
        if improvement_type == 'add_feature':
            prompt = f"""Tu es un développeur expert. Tu dois AJOUTER une nouvelle fonctionnalité à un projet existant.

PROJET : {project_data['name']}
TYPE : {project_data['type']}
TECH : {', '.join(project_data.get('tech_stack', []))}

{files_context}

NOUVELLE FONCTIONNALITÉ À AJOUTER :
{improvement_description}

INSTRUCTIONS IMPORTANTES :
1. NE PAS régénérer tout le projet
2. AJOUTER uniquement les nouveaux fichiers nécessaires
3. MODIFIER uniquement les fichiers existants qui ont besoin de changements
4. GARDER tout le code existant qui fonctionne
5. Intégrer proprement la nouvelle fonctionnalité dans l'architecture existante

Génère UNIQUEMENT les fichiers nouveaux ou modifiés."""

        elif improvement_type == 'fix_bug':
            prompt = f"""Tu es un développeur expert en debugging. Tu dois CORRIGER un bug dans un projet existant.

PROJET : {project_data['name']}

{files_context}

BUG À CORRIGER :
{improvement_description}

INSTRUCTIONS :
1. Identifier le fichier concerné par le bug
2. Corriger UNIQUEMENT le bug
3. Ne PAS modifier le reste du code
4. Tester que la correction ne casse rien d'autre

Génère UNIQUEMENT le(s) fichier(s) corrigé(s)."""

        elif improvement_type == 'style':
            prompt = f"""Tu es un designer/développeur frontend expert. Tu dois améliorer le DESIGN d'un projet existant.

PROJET : {project_data['name']}

{files_context}

AMÉLIORATION DESIGN DEMANDÉE :
{improvement_description}

INSTRUCTIONS :
1. Modifier les styles (Tailwind CSS, classes, couleurs)
2. Garder la structure HTML/JSX existante
3. Améliorer l'UX et l'accessibilité
4. Utiliser des animations subtiles si pertinent

Génère les fichiers avec le nouveau design."""

        elif improvement_type == 'optimize':
            prompt = f"""Tu es un développeur expert en optimisation. Tu dois OPTIMISER un projet existant.

PROJET : {project_data['name']}

{files_context}

OPTIMISATION DEMANDÉE :
{improvement_description}

INSTRUCTIONS :
1. Optimiser les performances (React.memo, useMemo, useCallback)
2. Réduire les re-renders inutiles
3. Optimiser les images et assets
4. Améliorer le temps de chargement
5. Ne PAS changer les fonctionnalités

Génère les fichiers optimisés."""

        else:
            # Amélioration générale
            prompt = f"""Tu es un développeur expert. Tu dois améliorer un projet existant.

PROJET : {project_data['name']}
DESCRIPTION ORIGINALE : {project_data['description']}

{files_context}

AMÉLIORATION DEMANDÉE :
{improvement_description}

INSTRUCTIONS :
1. Analyser le code existant
2. Appliquer les améliorations demandées
3. Garder ce qui fonctionne
4. Améliorer la qualité globale

Génère le code amélioré."""
        
        return prompt
    
    def merge_improvements(
        self,
        existing_files: List[Dict[str, Any]],
        improved_files: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Fusionne intelligemment les fichiers améliorés avec les existants
        
        Pour les fichiers non modifiés, garde l'original
        Pour les fichiers modifiés, utilise la nouvelle version
        Pour les nouveaux fichiers, ajoute-les
        """
        # Créer un dictionnaire des fichiers existants
        existing_dict = {f['filename']: f for f in existing_files}
        
        # Créer un dictionnaire des fichiers améliorés
        improved_dict = {f['filename']: f for f in improved_files}
        
        # Fusionner
        merged_files = []
        
        # Ajouter tous les fichiers améliorés (nouveaux ou modifiés)
        for filename, file_data in improved_dict.items():
            merged_files.append(file_data)
        
        # Ajouter les fichiers existants non touchés
        for filename, file_data in existing_dict.items():
            if filename not in improved_dict:
                merged_files.append(file_data)
        
        logger.info(f"🔀 Fusion: {len(existing_files)} existants + {len(improved_files)} améliorés = {len(merged_files)} finaux")
        
        return merged_files


# Instance globale
smart_improver = SmartImprover()

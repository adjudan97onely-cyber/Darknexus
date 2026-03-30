"""
SERVICE DE VALIDATION DU CODE GÉNÉRÉ (NIVEAU E5)
Valide automatiquement le code généré et détecte les erreurs avant de livrer
"""

import logging
import re
from typing import Dict, Any, List, Tuple
import json

logger = logging.getLogger(__name__)


class CodeValidator:
    """Validateur intelligent de code généré"""
    
    def __init__(self):
        self.validation_errors = []
        
    def validate_generated_code(self, files: List[Dict[str, Any]], project_type: str) -> Tuple[bool, List[str]]:
        """
        Valide le code généré et retourne (is_valid, errors)
        
        Args:
            files: Liste des fichiers générés
            project_type: Type de projet (web-app, pwa, python-script, etc.)
            
        Returns:
            Tuple (is_valid: bool, errors: List[str])
        """
        self.validation_errors = []
        
        try:
            logger.info(f"🔍 Validation du code pour projet type: {project_type}")
            
            # Validation selon le type de projet
            if project_type in ['web-app', 'pwa', 'mobile-app', 'mobile_app']:
                self._validate_web_app(files)
            elif project_type == 'python-script':
                self._validate_python_script(files)
            elif project_type == 'api':
                self._validate_api(files)
            else:
                # Validation générique
                self._validate_generic(files)
            
            is_valid = len(self.validation_errors) == 0
            
            if is_valid:
                logger.info("✅ Validation réussie - Code valide")
            else:
                logger.warning(f"⚠️ Validation échouée - {len(self.validation_errors)} erreurs trouvées")
                for error in self.validation_errors:
                    logger.warning(f"  - {error}")
            
            return is_valid, self.validation_errors
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la validation: {str(e)}")
            return False, [f"Erreur de validation: {str(e)}"]
    
    def _validate_web_app(self, files: List[Dict[str, Any]]):
        """Validation spécifique pour les web apps (React + Vite)"""
        filenames = [f['filename'] for f in files]
        
        # Vérifier les fichiers critiques
        required_files = {
            'index.html': 'Fichier index.html manquant (requis à la racine)',
            'package.json': 'Fichier package.json manquant',
            'vite.config.js': 'Fichier vite.config.js manquant',
            'src/main.jsx': 'Fichier src/main.jsx manquant',
            'src/App.jsx': 'Fichier src/App.jsx manquant'
        }
        
        for required_file, error_msg in required_files.items():
            if required_file not in filenames:
                self.validation_errors.append(error_msg)
        
        # Valider le contenu des fichiers critiques
        for file in files:
            filename = file['filename']
            content = file['content']
            
            if filename == 'package.json':
                self._validate_package_json(content)
            elif filename == 'src/App.jsx':
                self._validate_react_component(content, filename)
            elif filename == 'index.html':
                self._validate_html(content)
    
    def _validate_package_json(self, content: str):
        """Valide le fichier package.json"""
        try:
            package_data = json.loads(content)
            
            # Vérifier les scripts essentiels
            if 'scripts' not in package_data:
                self.validation_errors.append("package.json: section 'scripts' manquante")
            else:
                required_scripts = ['dev', 'build']
                for script in required_scripts:
                    if script not in package_data['scripts']:
                        self.validation_errors.append(f"package.json: script '{script}' manquant")
            
            # Vérifier les dépendances
            if 'dependencies' not in package_data:
                self.validation_errors.append("package.json: section 'dependencies' manquante")
            else:
                # Vérifier React
                if 'react' not in package_data['dependencies']:
                    self.validation_errors.append("package.json: dépendance 'react' manquante")
            
            # Vérifier que React n'est pas en version 19 (problèmes connus)
            if 'dependencies' in package_data and 'react' in package_data['dependencies']:
                react_version = package_data['dependencies']['react']
                if '19' in react_version:
                    self.validation_errors.append("package.json: React 19 détecté (utiliser React 18.3.1)")
                    
        except json.JSONDecodeError:
            self.validation_errors.append("package.json: JSON invalide")
    
    def _validate_react_component(self, content: str, filename: str):
        """Valide un composant React"""
        # Vérifier l'import de React
        if 'import React' not in content and 'import {' not in content:
            self.validation_errors.append(f"{filename}: Import React manquant")
        
        # Vérifier qu'il y a bien un export
        if 'export default' not in content and 'export {' not in content:
            self.validation_errors.append(f"{filename}: Export manquant")
        
        # Détecter les erreurs courantes
        
        # Erreur 1: Utilisation de classes CSS sans className
        if 'class=' in content and 'className=' not in content:
            self.validation_errors.append(f"{filename}: Utiliser 'className' au lieu de 'class' en React")
        
        # Erreur 2: Balises auto-fermantes mal formées
        self_closing_tags = ['img', 'input', 'br', 'hr', 'meta', 'link']
        for tag in self_closing_tags:
            # Chercher <tag> sans />
            pattern = f'<{tag}[^>]*[^/]>'
            if re.search(pattern, content):
                self.validation_errors.append(f"{filename}: Balise <{tag}> doit être auto-fermante (<{tag} />)")
        
        # Erreur 3: Utilisation de style inline sans objet
        if 'style="' in content:
            self.validation_errors.append(f"{filename}: Style inline doit être un objet {{style={{...}}}} en React")
    
    def _validate_html(self, content: str):
        """Valide le fichier HTML"""
        # Vérifier la structure de base
        required_elements = [
            ('<!DOCTYPE html>', 'DOCTYPE manquant'),
            ('<html', 'Balise <html> manquante'),
            ('<head>', 'Balise <head> manquante'),
            ('<body>', 'Balise <body> manquante'),
            ('<div id="root">', 'Div #root manquant (requis pour React)'),
            ('<script type="module"', 'Script module manquant')
        ]
        
        for element, error_msg in required_elements:
            if element not in content:
                self.validation_errors.append(f"index.html: {error_msg}")
    
    def _validate_python_script(self, files: List[Dict[str, Any]]):
        """Validation pour les scripts Python"""
        filenames = [f['filename'] for f in files]
        
        # Vérifier qu'il y a au moins un fichier .py
        if not any(f.endswith('.py') for f in filenames):
            self.validation_errors.append("Aucun fichier Python (.py) trouvé")
        
        # Vérifier requirements.txt
        if 'requirements.txt' not in filenames:
            self.validation_errors.append("Fichier requirements.txt manquant")
    
    def _validate_api(self, files: List[Dict[str, Any]]):
        """Validation pour les APIs"""
        filenames = [f['filename'] for f in files]
        
        # Vérifier les fichiers critiques pour une API
        if not any('main.py' in f or 'app.py' in f for f in filenames):
            self.validation_errors.append("Fichier main.py ou app.py manquant")
        
        if 'requirements.txt' not in filenames:
            self.validation_errors.append("Fichier requirements.txt manquant")
    
    def _validate_generic(self, files: List[Dict[str, Any]]):
        """Validation générique"""
        if len(files) == 0:
            self.validation_errors.append("Aucun fichier généré")
        
        # Vérifier qu'il y a un README
        filenames = [f['filename'] for f in files]
        if not any('README' in f.upper() for f in filenames):
            logger.warning("Aucun fichier README trouvé (recommandé)")
    
    def suggest_fixes(self, errors: List[str]) -> Dict[str, Any]:
        """
        Suggère des corrections pour les erreurs détectées
        
        Returns:
            Dict avec les suggestions de fix
        """
        suggestions = {
            'auto_fixable': [],
            'manual_fixes': []
        }
        
        for error in errors:
            if 'React 19' in error:
                suggestions['auto_fixable'].append({
                    'error': error,
                    'fix': "Remplacer React 19 par React 18.3.1 dans package.json"
                })
            elif 'className' in error:
                suggestions['auto_fixable'].append({
                    'error': error,
                    'fix': "Remplacer 'class=' par 'className=' dans les composants React"
                })
            else:
                suggestions['manual_fixes'].append({
                    'error': error,
                    'suggestion': "Régénération recommandée avec instructions corrigées"
                })
        
        return suggestions


# Instance globale
code_validator = CodeValidator()

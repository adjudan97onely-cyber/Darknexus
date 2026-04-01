"""
SERVICE AUTO-HEALING (NIVEAU E5)
Détecte automatiquement les erreurs dans les apps générées et propose des corrections
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


class AutoHealer:
    """Système d'auto-guérison pour les applications générées"""
    
    def __init__(self):
        self.common_fixes = {
            'react_class_to_classname': {
                'pattern': r'class=',
                'replacement': 'className=',
                'description': 'Remplacer class= par className= (React)'
            },
            'react_19_downgrade': {
                'pattern': r'"react":\s*"\^19',
                'replacement': '"react": "^18.3.1',
                'description': 'Downgrade React 19 vers 18.3.1'
            },
            'self_closing_tags': {
                'patterns': [
                    (r'<img([^>]*)(?<!/)>', r'<img\1 />'),
                    (r'<input([^>]*)(?<!/)>', r'<input\1 />'),
                    (r'<br(?<!/)>', '<br />'),
                    (r'<hr(?<!/)>', '<hr />'),
                ],
                'description': 'Ajouter / aux balises auto-fermantes'
            }
        }
    
    async def detect_issues(self, files: List[Dict[str, Any]], project_type: str) -> List[Dict[str, Any]]:
        """
        Détecte automatiquement les problèmes dans les fichiers générés
        
        Returns:
            Liste de problèmes détectés avec suggestions de fix
        """
        issues = []
        
        for file in files:
            filename = file['filename']
            content = file['content']
            
            # Détecter les problèmes selon le type de fichier
            if filename.endswith('.jsx') or filename.endswith('.js'):
                file_issues = self._detect_react_issues(content, filename)
                issues.extend(file_issues)
            
            elif filename == 'package.json':
                file_issues = self._detect_package_json_issues(content, filename)
                issues.extend(file_issues)
            
            elif filename.endswith('.html'):
                file_issues = self._detect_html_issues(content, filename)
                issues.extend(file_issues)
        
        logger.info(f"🔍 Auto-healing: {len(issues)} problèmes détectés")
        return issues
    
    def _detect_react_issues(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Détecte les problèmes dans les composants React"""
        issues = []
        
        # Problème 1: class= au lieu de className=
        if 'class=' in content and 'className=' not in content:
            issues.append({
                'file': filename,
                'issue': 'Utilisation de class= au lieu de className=',
                'severity': 'high',
                'auto_fixable': True,
                'fix_type': 'react_class_to_classname'
            })
        
        # Problème 2: Balises auto-fermantes mal formées
        self_closing_tags = ['img', 'input', 'br', 'hr']
        for tag in self_closing_tags:
            pattern = f'<{tag}[^>]*[^/]>'
            if re.search(pattern, content):
                issues.append({
                    'file': filename,
                    'issue': f'Balise <{tag}> pas auto-fermante',
                    'severity': 'medium',
                    'auto_fixable': True,
                    'fix_type': 'self_closing_tags'
                })
                break  # Un seul warning pour toutes les balises
        
        # Problème 3: Style inline incorrect
        if 'style="' in content:
            issues.append({
                'file': filename,
                'issue': 'Style inline doit être un objet en React',
                'severity': 'high',
                'auto_fixable': False,
                'suggestion': 'Utiliser style={{...}} au lieu de style="..."'
            })
        
        return issues
    
    def _detect_package_json_issues(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Détecte les problèmes dans package.json"""
        issues = []
        
        # Problème: React 19
        if '"react": "^19' in content or '"react": "19' in content:
            issues.append({
                'file': filename,
                'issue': 'React 19 détecté (problèmes de compatibilité)',
                'severity': 'high',
                'auto_fixable': True,
                'fix_type': 'react_19_downgrade',
                'recommendation': 'Utiliser React 18.3.1'
            })
        
        return issues
    
    def _detect_html_issues(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Détecte les problèmes dans les fichiers HTML"""
        issues = []
        
        # Vérifier la structure de base
        if '<div id="root">' not in content and '<div id="app">' not in content:
            issues.append({
                'file': filename,
                'issue': 'Div #root manquant (requis pour React)',
                'severity': 'critical',
                'auto_fixable': False,
                'suggestion': 'Ajouter <div id="root"></div> dans le body'
            })
        
        return issues
    
    async def auto_fix(self, files: List[Dict[str, Any]], issues: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Applique automatiquement les corrections possibles
        
        Returns:
            Tuple (fixed_files, applied_fixes)
        """
        fixed_files = [file.copy() for file in files]  # Copie profonde
        applied_fixes = []
        
        for issue in issues:
            if not issue.get('auto_fixable', False):
                continue
            
            fix_type = issue.get('fix_type')
            filename = issue['file']
            
            # Trouver le fichier à corriger
            file_idx = next((i for i, f in enumerate(fixed_files) if f['filename'] == filename), None)
            if file_idx is None:
                continue
            
            content = fixed_files[file_idx]['content']
            
            # Appliquer le fix selon le type
            if fix_type == 'react_class_to_classname':
                content = content.replace('class=', 'className=')
                applied_fixes.append(f"✅ {filename}: class= → className=")
            
            elif fix_type == 'react_19_downgrade':
                content = re.sub(r'"react":\s*"\^19[^"]*"', '"react": "^18.3.1"', content)
                content = re.sub(r'"react-dom":\s*"\^19[^"]*"', '"react-dom": "^18.3.1"', content)
                applied_fixes.append(f"✅ {filename}: React 19 → React 18.3.1")
            
            elif fix_type == 'self_closing_tags':
                # Appliquer tous les patterns
                for pattern, replacement in self.common_fixes['self_closing_tags']['patterns']:
                    content = re.sub(pattern, replacement, content)
                applied_fixes.append(f"✅ {filename}: Balises auto-fermantes corrigées")
            
            # Mettre à jour le contenu
            fixed_files[file_idx]['content'] = content
        
        logger.info(f"🔧 Auto-healing: {len(applied_fixes)} corrections appliquées")
        return fixed_files, applied_fixes
    
    async def heal_project(self, files: List[Dict[str, Any]], project_type: str) -> Dict[str, Any]:
        """
        Processus complet d'auto-healing : détection + correction
        
        Returns:
            Dict avec les résultats de l'auto-healing
        """
        logger.info(f"🏥 Démarrage auto-healing pour projet type: {project_type}")
        
        # 1. Détecter les problèmes
        issues = await self.detect_issues(files, project_type)
        
        if len(issues) == 0:
            logger.info("✅ Aucun problème détecté")
            return {
                'status': 'healthy',
                'issues_found': 0,
                'fixes_applied': 0,
                'files': files
            }
        
        # 2. Séparer auto-fixable vs manuel
        auto_fixable = [i for i in issues if i.get('auto_fixable', False)]
        manual_fixes = [i for i in issues if not i.get('auto_fixable', False)]
        
        logger.info(f"📊 {len(auto_fixable)} auto-fixable, {len(manual_fixes)} manuels")
        
        # 3. Appliquer les corrections automatiques
        if len(auto_fixable) > 0:
            fixed_files, applied_fixes = await self.auto_fix(files, auto_fixable)
        else:
            fixed_files = files
            applied_fixes = []
        
        # 4. Retourner le résultat
        return {
            'status': 'healed' if len(applied_fixes) > 0 else 'issues_detected',
            'issues_found': len(issues),
            'auto_fixes_applied': len(applied_fixes),
            'manual_fixes_needed': len(manual_fixes),
            'applied_fixes': applied_fixes,
            'remaining_issues': manual_fixes,
            'files': fixed_files
        }


# Instance globale
auto_healer = AutoHealer()

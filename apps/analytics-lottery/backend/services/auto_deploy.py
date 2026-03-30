"""
AUTO DEPLOY SERVICE - Déploiement automatique des projets
Permet de déployer les projets créés sur des plateformes d'hébergement
"""

import os
import logging
import tempfile
import subprocess
import json
from typing import Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class AutoDeployService:
    """
    Service de déploiement automatique vers différentes plateformes
    """
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "adj_killagain_deploys"
        self.temp_dir.mkdir(exist_ok=True)
    
    async def deploy_to_vercel(
        self,
        project_id: str,
        project_name: str,
        files: list,
        vercel_token: str = None
    ) -> Dict[str, Any]:
        """
        Déploie un projet sur Vercel
        
        Returns:
            Dict avec 'success', 'url', 'message'
        """
        try:
            # Créer un dossier temporaire pour le projet
            project_dir = self.temp_dir / project_id
            project_dir.mkdir(exist_ok=True)
            
            # Écrire tous les fichiers
            for file in files:
                file_path = project_dir / file['filename']
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file['content'], encoding='utf-8')
            
            # Créer un package.json si nécessaire pour les projets web
            if self._is_web_project(files):
                await self._create_package_json(project_dir, project_name)
            
            # Vérifier si Vercel CLI est installé
            vercel_installed = await self._check_vercel_cli()
            
            if not vercel_installed:
                return {
                    'success': False,
                    'error': 'Vercel CLI not installed',
                    'message': 'Vercel CLI n\'est pas installé. Installez-le avec: npm install -g vercel',
                    'install_guide': 'Pour déployer automatiquement, l\'utilisateur doit installer Vercel CLI'
                }
            
            # Déployer sur Vercel
            deploy_result = await self._deploy_vercel(project_dir, vercel_token)
            
            if deploy_result['success']:
                return {
                    'success': True,
                    'url': deploy_result['url'],
                    'message': f'Projet déployé avec succès sur {deploy_result["url"]}',
                    'platform': 'vercel'
                }
            else:
                return {
                    'success': False,
                    'error': deploy_result['error'],
                    'message': 'Échec du déploiement sur Vercel'
                }
                
        except Exception as e:
            logger.error(f"Error deploying to Vercel: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors du déploiement: {str(e)}'
            }
    
    async def deploy_to_netlify(
        self,
        project_id: str,
        project_name: str,
        files: list
    ) -> Dict[str, Any]:
        """
        Déploie un projet sur Netlify
        """
        try:
            project_dir = self.temp_dir / project_id
            project_dir.mkdir(exist_ok=True)
            
            # Écrire les fichiers
            for file in files:
                file_path = project_dir / file['filename']
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file['content'], encoding='utf-8')
            
            # Pour Netlify, on peut utiliser leur API ou CLI
            # Pour l'instant, retourner un guide
            return {
                'success': False,
                'message': 'Déploiement Netlify en développement',
                'guide': {
                    'step1': 'Téléchargez le projet',
                    'step2': 'Allez sur netlify.com',
                    'step3': 'Glissez-déposez le dossier du projet',
                    'step4': 'Votre site sera en ligne en quelques secondes'
                }
            }
            
        except Exception as e:
            logger.error(f"Error deploying to Netlify: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors du déploiement: {str(e)}'
            }
    
    async def get_deployment_guide(self, project_type: str) -> Dict[str, Any]:
        """
        Retourne un guide de déploiement selon le type de projet
        """
        guides = {
            'web-app': {
                'recommended': 'Vercel ou Netlify',
                'steps': [
                    '1. Téléchargez votre projet (bouton Télécharger)',
                    '2. Créez un compte sur vercel.com ou netlify.com',
                    '3. Importez votre projet',
                    '4. Configurez les paramètres (si nécessaire)',
                    '5. Déployez en un clic !',
                    '6. Obtenez votre URL publique'
                ],
                'platforms': [
                    {
                        'name': 'Vercel',
                        'url': 'https://vercel.com',
                        'pros': 'Gratuit, rapide, excellent pour Next.js et React',
                        'free': True
                    },
                    {
                        'name': 'Netlify',
                        'url': 'https://netlify.com',
                        'pros': 'Gratuit, simple, drag-and-drop',
                        'free': True
                    },
                    {
                        'name': 'GitHub Pages',
                        'url': 'https://pages.github.com',
                        'pros': 'Gratuit, intégré à GitHub',
                        'free': True
                    }
                ]
            },
            'python-script': {
                'recommended': 'Replit ou PythonAnywhere',
                'steps': [
                    '1. Créez un compte sur replit.com',
                    '2. Créez un nouveau Repl Python',
                    '3. Copiez-collez votre code',
                    '4. Installez les dépendances depuis requirements.txt',
                    '5. Exécutez votre script !'
                ],
                'platforms': [
                    {
                        'name': 'Replit',
                        'url': 'https://replit.com',
                        'pros': 'Gratuit, IDE en ligne, partage facile',
                        'free': True
                    },
                    {
                        'name': 'PythonAnywhere',
                        'url': 'https://www.pythonanywhere.com',
                        'pros': 'Gratuit, spécialisé Python',
                        'free': True
                    }
                ]
            },
            'api': {
                'recommended': 'Railway ou Render',
                'steps': [
                    '1. Créez un compte sur railway.app',
                    '2. Créez un nouveau projet',
                    '3. Importez votre code',
                    '4. Configurez les variables d\'environnement',
                    '5. Déployez automatiquement',
                    '6. Obtenez l\'URL de votre API'
                ],
                'platforms': [
                    {
                        'name': 'Railway',
                        'url': 'https://railway.app',
                        'pros': 'Gratuit, simple, auto-deploy from Git',
                        'free': True
                    },
                    {
                        'name': 'Render',
                        'url': 'https://render.com',
                        'pros': 'Gratuit, excellente intégration',
                        'free': True
                    },
                    {
                        'name': 'Heroku',
                        'url': 'https://heroku.com',
                        'pros': 'Populaire, bien documenté',
                        'free': False
                    }
                ]
            }
        }
        
        return guides.get(project_type, guides['web-app'])
    
    def _is_web_project(self, files: list) -> bool:
        """Vérifie si c'est un projet web"""
        return any(
            f['filename'].endswith('.html') or 
            f['filename'].endswith('.jsx') or
            f['filename'].endswith('.tsx')
            for f in files
        )
    
    async def _create_package_json(self, project_dir: Path, project_name: str):
        """Crée un package.json minimal pour les projets web"""
        package_json = {
            "name": project_name.lower().replace(' ', '-'),
            "version": "1.0.0",
            "description": f"Generated by ADJ KILLAGAIN IA 2.0",
            "main": "index.html",
            "scripts": {
                "start": "serve ."
            },
            "keywords": [],
            "author": "",
            "license": "MIT"
        }
        
        package_path = project_dir / "package.json"
        if not package_path.exists():
            package_path.write_text(json.dumps(package_json, indent=2))
    
    async def _check_vercel_cli(self) -> bool:
        """Vérifie si Vercel CLI est installé"""
        try:
            result = subprocess.run(
                ['vercel', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    async def _deploy_vercel(self, project_dir: Path, token: str = None) -> Dict[str, Any]:
        """Déploie sur Vercel"""
        try:
            cmd = ['vercel', '--yes', '--prod']
            if token:
                cmd.extend(['--token', token])
            
            result = subprocess.run(
                cmd,
                cwd=str(project_dir),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                # Extraire l'URL du déploiement
                output = result.stdout
                url = None
                for line in output.split('\n'):
                    if 'https://' in line:
                        url = line.strip()
                        break
                
                return {
                    'success': True,
                    'url': url or 'Déployé avec succès'
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Instance globale
auto_deploy_service = AutoDeployService()

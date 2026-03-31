"""
SERVICE DE DÉPLOIEMENT VERCEL (NIVEAU E5)
Déploiement automatique en 1 clic sur Vercel
"""

import logging
import os
import json
import httpx
from typing import Dict, Any, Optional
import base64

logger = logging.getLogger(__name__)


class VercelDeployer:
    """Déploiement automatique sur Vercel"""
    
    def __init__(self):
        self.vercel_api_url = "https://api.vercel.com"
        self.vercel_token = os.getenv("VERCEL_TOKEN")  # Token optionnel
    
    async def create_deployment_package(self, files: list) -> Dict[str, Any]:
        """
        Crée un package de déploiement Vercel depuis les fichiers du projet
        
        Returns:
            Dict avec files encodés en base64 pour Vercel API
        """
        deployment_files = {}
        
        for file in files:
            filename = file['filename']
            content = file['content']
            
            # Encoder en base64 pour l'API Vercel
            encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
            
            deployment_files[filename] = {
                'file': encoded_content,
                'encoding': 'base64'
            }
        
        logger.info(f"📦 Package créé: {len(deployment_files)} fichiers")
        return deployment_files
    
    def generate_vercel_json(self, project_name: str, project_type: str) -> str:
        """Génère la configuration vercel.json"""
        
        if project_type in ['web-app', 'pwa', 'mobile-app']:
            # Configuration pour apps React/Vite
            config = {
                "buildCommand": "yarn build",
                "outputDirectory": "dist",
                "framework": "vite",
                "rewrites": [
                    {
                        "source": "/(.*)",
                        "destination": "/index.html"
                    }
                ]
            }
        elif project_type == 'api':
            # Configuration pour API
            config = {
                "builds": [
                    {
                        "src": "*.py",
                        "use": "@vercel/python"
                    }
                ]
            }
        else:
            # Configuration par défaut
            config = {
                "buildCommand": "yarn build",
                "outputDirectory": "dist"
            }
        
        return json.dumps(config, indent=2)
    
    async def deploy_to_vercel(
        self,
        project_name: str,
        files: list,
        vercel_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Déploie un projet sur Vercel via l'API
        
        Args:
            project_name: Nom du projet
            files: Liste des fichiers du projet
            vercel_token: Token Vercel de l'utilisateur (optionnel)
            
        Returns:
            Dict avec URL de déploiement et status
        """
        try:
            # Utiliser le token fourni ou le token par défaut
            token = vercel_token or self.vercel_token
            
            if not token:
                return {
                    'success': False,
                    'error': 'Token Vercel requis',
                    'instructions': 'Créez un token sur https://vercel.com/account/tokens'
                }
            
            # Créer le package de déploiement
            deployment_files = await self.create_deployment_package(files)
            
            # Préparer la requête Vercel
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            deployment_data = {
                'name': project_name.lower().replace(' ', '-'),
                'files': deployment_files,
                'projectSettings': {
                    'framework': 'vite',
                    'buildCommand': 'yarn build',
                    'outputDirectory': 'dist'
                }
            }
            
            # Envoyer la requête de déploiement
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f'{self.vercel_api_url}/v13/deployments',
                    headers=headers,
                    json=deployment_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    deployment_url = result.get('url', 'N/A')
                    
                    logger.info(f"✅ Déploiement Vercel réussi: {deployment_url}")
                    
                    return {
                        'success': True,
                        'url': f'https://{deployment_url}',
                        'deployment_id': result.get('id'),
                        'status': 'deployed'
                    }
                else:
                    logger.error(f"❌ Erreur Vercel API: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'error': f'Erreur API Vercel: {response.status_code}',
                        'details': response.text
                    }
        
        except httpx.TimeoutException:
            logger.error("⏰ Timeout lors du déploiement Vercel")
            return {
                'success': False,
                'error': 'Timeout du déploiement (>120s)',
                'suggestion': 'Réessayez dans quelques instants'
            }
        
        except Exception as e:
            logger.error(f"❌ Erreur déploiement Vercel: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_deployment_instructions(self, project_name: str, files: list) -> str:
        """
        Génère les instructions de déploiement manuel sur Vercel
        
        Returns:
            Markdown avec instructions complètes
        """
        return f"""# 🚀 Déploiement sur Vercel - {project_name}

## 🎯 Méthode 1 : Déploiement automatique (Recommandé)

1. **Connecte ton compte Vercel** :
   - Va sur https://vercel.com/signup
   - Connecte-toi avec GitHub

2. **Importe ton projet** :
   - Clique sur "Add New" → "Project"
   - Importe depuis GitHub
   - Sélectionne ton repo `{project_name.lower().replace(' ', '-')}`

3. **Configure le déploiement** :
   - Framework: **Vite**
   - Build Command: `yarn build`
   - Output Directory: `dist`
   - Clique sur **"Deploy"**

4. **C'est fait !** 🎉
   - Vercel te donne une URL : `https://{project_name.lower().replace(' ', '-')}.vercel.app`
   - Ton app est en ligne !

---

## 💻 Méthode 2 : CLI Vercel (Pour développeurs)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
cd {project_name.lower().replace(' ', '-')}
vercel

# Suivre les instructions à l'écran
```

---

## 🔑 Méthode 3 : API Vercel (Avancé)

Si tu veux déployer via API, tu peux utiliser la route `/api/projects/{{project_id}}/deploy` de ADJ KILLAGAIN IA 2.0.

Tu auras besoin d'un **token Vercel** :
1. Va sur https://vercel.com/account/tokens
2. Crée un nouveau token
3. Utilise-le dans la requête API

---

## ✅ Après le déploiement

Ton app sera accessible à :
- **Production** : `https://{project_name.lower().replace(' ', '-')}.vercel.app`
- **Preview** : Une URL unique pour chaque commit

---

## 📱 Installer comme PWA

Une fois déployée :
1. Ouvre l'URL sur ton téléphone
2. Chrome/Safari proposera : "Ajouter à l'écran d'accueil"
3. Clique → Ton app est installée ! 🎉

---

## 🆓 Coût

Vercel est **100% GRATUIT** pour :
- Sites personnels
- Projets hobby
- Bande passante illimitée
- SSL automatique
- CDN global

---

**Besoin d'aide ?** Consulte la doc Vercel : https://vercel.com/docs
"""


# Instance globale
vercel_deployer = VercelDeployer()

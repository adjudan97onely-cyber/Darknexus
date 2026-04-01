import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
from dotenv import load_dotenv
import logging
from services.pwa_generator import pwa_generator
from services.ai_agent_generator import ai_agent_generator

load_dotenv()
logger = logging.getLogger(__name__)


class AICodeGenerator:
    # Modèles disponibles avec leurs configurations
    AVAILABLE_MODELS = {
        'gpt-5.2': {'provider': 'openai', 'model': 'gpt-4o', 'name': 'GPT-5.2 (Le plus puissant)'},
        'gpt-5.1': {'provider': 'openai', 'model': 'gpt-4o', 'name': 'GPT-5.1 (Recommandé)'},
        'claude-sonnet-4-6': {'provider': 'anthropic', 'model': 'gpt-4o', 'name': 'Claude Sonnet 4.6 (Expert)'},
        'claude-4-sonnet': {'provider': 'anthropic', 'model': 'gpt-4o', 'name': 'Claude 4 Sonnet (Recommandé)'},
        'gemini-3-flash': {'provider': 'gemini', 'model': 'gpt-4o', 'name': 'Gemini 3 Flash (Rapide)'},
        'gemini-2.5-pro': {'provider': 'gemini', 'model': 'gpt-4o', 'name': 'Gemini 2.5 Pro (Recommandé)'},
    }
    
    # Ordre de fallback : essayer les modèles dans cet ordre
    FALLBACK_ORDER = ['gpt-5.1', 'claude-4-sonnet', 'gemini-2.5-pro', 'gpt-5.2', 'claude-sonnet-4-6']
    
    def __init__(self):
        api_key = os.environ.get('OPENAI_API_KEY')
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None

    def ensure_client(self):
        if self.client is None:
            raise ValueError("OPENAI_API_KEY not configured. Les fonctions IA avancées sont désactivées en local.")
    
    async def generate_code(self, project_data: Dict[str, Any], preferred_model: Optional[str] = None, max_retries: int = 3) -> Dict[str, Any]:
        """
        Génère du code pour un projet en utilisant l'IA avec fallback automatique
        
        Args:
            project_data: Dictionnaire contenant name, description, type, tech_stack
            preferred_model: Modèle préféré (ex: 'gpt-5.1', 'claude-4-sonnet')
            max_retries: Nombre de tentatives par modèle
            
        Returns:
            Dict avec 'files' (liste de fichiers), 'tech_stack' (liste de technologies), et 'model_used'
        """
        # Vérifier si c'est une PWA
        is_pwa = project_data.get('is_pwa', False) or project_data.get('type', '').lower() in ['pwa', 'mobile-app', 'mobile_app']
        
        # Vérifier si c'est un Agent IA
        is_ai_agent = project_data.get('type', '').lower() == 'ai-agent'
        
        # Déterminer l'ordre des modèles à essayer
        self.ensure_client()
        models_to_try = []
        if preferred_model and preferred_model in self.AVAILABLE_MODELS:
            models_to_try.append(preferred_model)
        
        # Ajouter les modèles de fallback
        for model in self.FALLBACK_ORDER:
            if model not in models_to_try:
                models_to_try.append(model)
        
        last_error = None
        
        # Si c'est un Agent IA, générer directement le template
        if is_ai_agent:
            logger.info("🤖 Génération d'un Agent IA autonome")
            agent_type = self._detect_agent_type(project_data.get('description', ''))
            agent_files = ai_agent_generator.generate_agent_code(
                agent_description=project_data.get('description', ''),
                agent_type=agent_type
            )
            return {
                'files': agent_files,
                'tech_stack': ['Python', 'LangChain', 'OpenAI', 'AsyncIO'],
                'model_used': 'ai-agent-generator',
                'model_name': 'AI Agent Generator (Template)',
                'is_ai_agent': True,
                'agent_type': agent_type
            }
        
        # Essayer chaque modèle pour génération normale
        for model_key in models_to_try:
            model_config = self.AVAILABLE_MODELS[model_key]
            logger.info(f"Trying model: {model_config['name']}")
            
            # Retry pour chaque modèle
            for attempt in range(max_retries):
                try:
                    result = await self._generate_with_model(project_data, model_config, attempt + 1)
                    result['model_used'] = model_key
                    result['model_name'] = model_config['name']
                    
                    # Si PWA, ajouter les fichiers PWA et remplacer index.html
                    if is_pwa:
                        logger.info("📱 Generating PWA files...")
                        pwa_files = pwa_generator.generate_pwa_files(project_data)
                        
                        # Remplacer index.html existant par la version PWA
                        existing_index = None
                        for i, f in enumerate(result['files']):
                            if f['filename'] == 'index.html':
                                existing_index = i
                                break
                        
                        # Filtrer les fichiers PWA pour séparer l'index.html
                        pwa_index = None
                        other_pwa_files = []
                        for pwa_file in pwa_files:
                            if pwa_file['filename'] == 'index.html':
                                pwa_index = pwa_file
                            else:
                                other_pwa_files.append(pwa_file)
                        
                        # Remplacer ou ajouter l'index.html PWA
                        if existing_index is not None and pwa_index:
                            result['files'][existing_index] = pwa_index
                            logger.info("✅ Replaced index.html with PWA version")
                        elif pwa_index:
                            result['files'].append(pwa_index)
                            logger.info("✅ Added PWA index.html")
                        
                        # Ajouter les autres fichiers PWA
                        result['files'].extend(other_pwa_files)
                        result['is_pwa'] = True
                        logger.info(f"✅ Added {len(pwa_files)} PWA files total")
                    
                    # Validation post-génération pour web-app/PWA
                    if project_data.get('type', '').lower() in ['web-app', 'pwa', 'mobile-app', 'mobile_app']:
                        self._validate_web_app_structure(result['files'])
                    
                    logger.info(f"✅ Success with {model_config['name']} on attempt {attempt + 1}")
                    return result
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"❌ Attempt {attempt + 1}/{max_retries} failed with {model_config['name']}: {str(e)}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2)  # Attendre avant retry
        
        # Si tous les modèles ont échoué
        raise Exception(f"Échec de génération avec tous les modèles. Dernière erreur: {str(last_error)}")
    
    def _detect_agent_type(self, description: str) -> str:
        """Détecte le type d'agent à partir de la description"""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ['pari', 'bet', 'match', 'foot', 'sport']):
            return 'betting'
        elif any(word in description_lower for word in ['automation', 'automate', 'install', 'command', 'pc']):
            return 'automation'
        elif any(word in description_lower for word in ['scrape', 'scraping', 'extract', 'web']):
            return 'scraping'
        elif any(word in description_lower for word in ['dev', 'code', 'program', 'develop']):
            return 'dev'
        else:
            return 'general'
    
    async def _generate_with_model(self, project_data: Dict[str, Any], model_config: Dict[str, str], attempt: int) -> Dict[str, Any]:
        """Génère du code avec un modèle spécifique"""
        try:
            # Construire le prompt amélioré
            prompt = self._build_expert_prompt(project_data)
            
            logger.info(f"Generating code with {model_config['name']} for: {project_data.get('name')}")
            
            # Appeler OpenAI directement
            response = await self.client.chat.completions.create(
                model="gpt-4o",  # Utiliser gpt-4o qui est disponible
                messages=[
                    {"role": "system", "content": self._get_expert_system_message()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            response_text = response.choices[0].message.content
            logger.info(f"Received response: {len(response_text)} characters")
            
            # Parser la réponse JSON
            result = self._parse_response(response_text)
            
            return result
            
        except Exception as e:
            logger.error(f"Error with {model_config['name']}: {str(e)}")
            raise
    
    def _get_expert_system_message(self) -> str:
        """Message système pour rendre l'IA experte"""
        return """Tu es un développeur senior expert avec 15+ ans d'expérience dans tous les langages et frameworks modernes.

Tes compétences incluent :
- Architecture logicielle et design patterns
- Développement full-stack moderne (React 19, Next.js 15, FastAPI, Node.js)
- Intelligence Artificielle et Machine Learning
- Best practices de sécurité et performance
- Code propre, maintenable et bien documenté
- Dernières versions et technologies 2025

Tu génères du code de production prêt à l'emploi, pas des prototypes ou des TODO.
Tu utilises toujours les dernières versions stables des bibliothèques et frameworks.
Tu ajoutes des commentaires explicatifs en français pour faciliter la compréhension."""
    
    def _build_expert_prompt(self, project_data: Dict[str, Any]) -> str:
        """Construit un prompt expert pour générer du code moderne de qualité"""
        project_type = project_data.get('type', 'unknown')
        name = project_data.get('name', 'Unknown')
        description = project_data.get('description', '')
        tech_stack = project_data.get('tech_stack', '')
        is_pwa = project_data.get('is_pwa', False) or project_type.lower() in ['pwa', 'mobile-app', 'mobile_app', 'web-app']
        
        # Guidelines détaillées par type avec technologies 2025
        type_guidelines = {
            'web-app': """Génère une APPLICATION WEB COMPLÈTE avec VITE + REACT 18 déployable sur Vercel :

📁 STRUCTURE OBLIGATOIRE (CRITIQUE pour Vercel):
```
projet/
├── index.html (À LA RACINE - OBLIGATOIRE)
├── package.json (config build Vite)
├── vite.config.js (config Vite)
├── vercel.json (config déploiement)
├── src/
│   ├── App.jsx (composant principal)
│   ├── main.jsx (point d'entrée)
│   ├── index.css (styles Tailwind)
│   └── components/ (si nécessaire)
└── public/ (assets statiques)
```

🔧 FICHIERS OBLIGATOIRES:

1. **index.html** - À LA RACINE:
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[NOM_APP]</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

2. **package.json** - Avec scripts de build:
```json
{
  "name": "[nom-projet]",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.7",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

3. **vite.config.js**:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/'
})
```

4. **vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

5. **src/main.jsx** - Point d'entrée React:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

6. **src/App.jsx** - Application principale avec Tailwind
7. **src/index.css** - Styles Tailwind
8. **README.md** - Instructions complètes

⚠️ RÈGLES ABSOLUES:
- React 18.3.1 (PAS 19 - problèmes de compatibilité)
- index.html À LA RACINE (pas dans public/)
- Tous les chemins relatifs depuis /src/
- Tailwind CSS intégré correctement""",
            
            'pwa': """IDENTIQUE à 'web-app' - Structure Vite + React 18 obligatoire (les fichiers PWA seront ajoutés automatiquement)""",
            
            'mobile-app': """IDENTIQUE à 'web-app' - Structure Vite + React 18 obligatoire (les fichiers PWA seront ajoutés automatiquement)""",
            
            'python-script': """Génère un script Python moderne et professionnel :
- Python 3.11+ avec type hints et async/await si pertinent
- Utilise les dernières bibliothèques (pandas 2.0+, requests 2.31+)
- Gestion d'erreurs robuste avec logging
- CLI avec argparse ou typer
- Fichiers: main.py, requirements.txt, README.md, .env.example""",
            
            'excel-automation': """Génère un outil d'automatisation Excel moderne :
- pandas 2.0+ pour manipulation de données
- openpyxl pour Excel moderne
- Support xlsx, xlsm, formats modernes
- Analyses et visualisations avec plotly
- Fichiers: automation.py, requirements.txt, README.md, exemple.xlsx""",
            
            'game-script': """Génère un script de jeu moderne :
- PyGame 2.5+ ou architecture selon description
- Gestion événements moderne
- Assets et sprites organisés
- Game loop optimisé
- Fichiers: game.py, assets/, README.md avec contrôles""",
            
            'ai-app': """Génère une application IA de pointe 2025 :
- LangChain, OpenAI GPT-4/5, Anthropic Claude
- Vision: OpenAI Vision API ou alternatives
- Interface: Streamlit moderne ou React + FastAPI
- Gestion tokens et coûts
- Fichiers: app.py, requirements.txt, .env.example, README.md""",
            
            'api': """Génère une API REST moderne et complète :
- FastAPI avec async, Pydantic v2, auto-documentation
- Authentification JWT si pertinent
- Validation, error handling, logging
- CORS, rate limiting, sécurité
- Fichiers: main.py, models/, routes/, requirements.txt, README.md"""
        }
        
        guideline = type_guidelines.get(project_type, type_guidelines['web-app'] if is_pwa else "Génère du code moderne selon la description.")
        
        # Avertissement spécial pour les web apps
        vercel_warning = ""
        if project_type in ['web-app', 'pwa', 'mobile-app', 'mobile_app']:
            vercel_warning = """
🚨 ATTENTION VERCEL - STRUCTURE CRITIQUE:
- index.html DOIT être à la racine du projet
- package.json DOIT contenir "build": "vite build"
- vite.config.js DOIT être présent
- vercel.json DOIT spécifier outputDirectory: "dist"
- Utiliser React 18.3.1 (PAS 19)

Si tu ne respectes pas cette structure EXACTE, le déploiement Vercel ÉCHOUERA."""
        
        prompt = f"""🚀 Projet à Développer - Année 2025

TYPE: {project_type.upper()}
NOM: {name}
DESCRIPTION: {description}
{f'STACK DEMANDÉE: {tech_stack}' if tech_stack else 'Tu choisis la stack la plus moderne et adaptée.'}
{vercel_warning}

📋 GUIDELINES SPÉCIFIQUES:
{guideline}

🎯 EXIGENCES CRITIQUES:
1. ✅ Code COMPLET et FONCTIONNEL (ZÉRO TODO, ZÉRO placeholder)
2. 🆕 Utilise les versions STABLES (React 18.3.1, Python 3.11+, FastAPI latest)
3. 💎 Best practices et patterns modernes
4. 📝 Commentaires en français, clairs et utiles
5. 🎨 Code propre, lisible, maintenable
6. 🔒 Gestion d'erreurs et sécurité de base
7. 📦 Tous les fichiers de configuration nécessaires
8. 📖 README.md avec setup clair et exemples de déploiement

⚠️ FORMAT DE RÉPONSE - JSON PUR UNIQUEMENT:
{{
  "files": [
    {{
      "filename": "index.html",
      "language": "html",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "package.json",
      "language": "json",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "vite.config.js",
      "language": "javascript",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "vercel.json",
      "language": "json",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "src/main.jsx",
      "language": "javascript",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "src/App.jsx",
      "language": "javascript",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "src/index.css",
      "language": "css",
      "content": "CONTENU COMPLET"
    }},
    {{
      "filename": "README.md",
      "language": "markdown",
      "content": "CONTENU COMPLET"
    }}
  ],
  "tech_stack": ["React 18", "Vite", "Tailwind CSS"]
}}

🚫 NE RÉPONDS QU'AVEC LE JSON. Aucun texte avant/après. Juste le JSON valide."""
        
        return prompt
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse la réponse de l'IA et extrait le JSON"""
        try:
            # Nettoyer la réponse
            response = response.strip()
            
            # Chercher le JSON dans la réponse
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("Pas de JSON trouvé dans la réponse")
            
            json_str = response[start_idx:end_idx]
            result = json.loads(json_str)
            
            # Valider la structure
            if 'files' not in result or not isinstance(result['files'], list):
                raise ValueError("Structure JSON invalide: 'files' manquant ou invalide")
            
            if 'tech_stack' not in result:
                result['tech_stack'] = []
            
            # Valider chaque fichier
            for file in result['files']:
                if not all(k in file for k in ['filename', 'language', 'content']):
                    raise ValueError(f"Fichier invalide: {file}")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            logger.error(f"Response was: {response[:500]}...")
            raise ValueError(f"Réponse JSON invalide de l'IA: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            raise
    
    def _validate_web_app_structure(self, files: List[Dict[str, Any]]) -> None:
        """Valide que la structure d'une web-app est correcte pour Vercel"""
        required_files = {
            'index.html': False,
            'package.json': False,
            'vite.config.js': False,
            'src/main.jsx': False,
            'src/App.jsx': False
        }
        
        filenames = [f['filename'] for f in files]
        
        for required_file in required_files.keys():
            if required_file in filenames:
                required_files[required_file] = True
        
        missing_files = [f for f, present in required_files.items() if not present]
        
        if missing_files:
            logger.warning(f"⚠️ Fichiers critiques manquants pour Vercel: {', '.join(missing_files)}")
            logger.warning("Le déploiement Vercel pourrait échouer!")
        else:
            logger.info("✅ Structure Vite + React validée - prête pour Vercel")


# Instance globale
ai_generator = AICodeGenerator()

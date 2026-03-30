"""
AI AGENT GENERATOR - Générateur d'agents IA autonomes
Génère du code Python complet pour des agents LangChain/AutoGPT
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class AIAgentGenerator:
    """Génère des agents IA autonomes basés sur des descriptions"""
    
    def generate_agent_code(self, agent_description: str, agent_type: str = 'general') -> List[Dict[str, str]]:
        """
        Génère tous les fichiers nécessaires pour un agent IA
        
        Args:
            agent_description: Description des capacités de l'agent
            agent_type: Type d'agent (betting, automation, dev, etc.)
            
        Returns:
            Liste de fichiers générés
        """
        files = []
        
        # 1. Main agent file
        files.append({
            'filename': 'agent.py',
            'language': 'python',
            'content': self._generate_main_agent(agent_description, agent_type)
        })
        
        # 2. Requirements
        files.append({
            'filename': 'requirements.txt',
            'language': 'text',
            'content': self._generate_requirements(agent_type)
        })
        
        # 3. Configuration
        files.append({
            'filename': 'config.yaml',
            'language': 'yaml',
            'content': self._generate_config(agent_type)
        })
        
        # 4. README
        files.append({
            'filename': 'README.md',
            'language': 'markdown',
            'content': self._generate_readme(agent_description, agent_type)
        })
        
        # 5. Tools module (si nécessaire)
        if agent_type in ['betting', 'automation', 'scraping']:
            files.append({
                'filename': 'tools.py',
                'language': 'python',
                'content': self._generate_tools(agent_type)
            })
        
        # 6. Installer script
        files.append({
            'filename': 'install.sh',
            'language': 'bash',
            'content': self._generate_installer()
        })
        
        logger.info(f"✅ Generated {len(files)} files for AI agent")
        return files
    
    def _generate_main_agent(self, description: str, agent_type: str) -> str:
        """Génère le fichier principal de l'agent"""
        
        base_code = f'''"""
AGENT IA AUTONOME
{description}

Généré par ADJ KILLAGAIN IA 2.0
"""

import os
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
import asyncio
from typing import List, Dict, Any

class AutonomousAgent:
    """Agent IA autonome avec capacités avancées"""
    
    def __init__(self, api_key: str = None):
        """
        Initialise l'agent
        
        Args:
            api_key: Clé API OpenAI (ou utiliser OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        
        # Modèle LLM
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",  # Rapide et économique
            temperature=0.7,
            api_key=self.api_key
        )
        
        # Mémoire de conversation
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Outils disponibles
        self.tools = self._setup_tools()
        
        # Agent LangChain
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True,
            max_iterations=10
        )
        
        print("✅ Agent IA initialisé avec succès !")
    
    def _setup_tools(self) -> List[Tool]:
        """Configure les outils de l'agent"""
        tools = []
        
'''
        
        # Ajouter des outils selon le type
        if agent_type == 'betting':
            base_code += '''        # Outils pour paris sportifs
        tools.append(Tool(
            name="Scrape Match Data",
            func=self._scrape_match_data,
            description="Récupère les données d'un match (stats, historique, cotes)"
        ))
        
        tools.append(Tool(
            name="Analyze Match",
            func=self._analyze_match,
            description="Analyse un match et calcule les probabilités"
        ))
        
        tools.append(Tool(
            name="Recommend Bet",
            func=self._recommend_bet,
            description="Recommande un pari avec confiance et mise suggérée"
        ))
'''
        
        elif agent_type == 'automation':
            base_code += '''        # Outils pour automatisation PC
        tools.append(Tool(
            name="Execute Command",
            func=self._execute_command,
            description="Exécute une commande shell/PowerShell"
        ))
        
        tools.append(Tool(
            name="Read File",
            func=self._read_file,
            description="Lit le contenu d'un fichier"
        ))
        
        tools.append(Tool(
            name="Write File",
            func=self._write_file,
            description="Écrit dans un fichier"
        ))
'''
        
        else:  # general
            base_code += '''        # Outils généraux
        tools.append(Tool(
            name="Web Search",
            func=self._web_search,
            description="Recherche des informations sur le web"
        ))
        
        tools.append(Tool(
            name="Analyze Text",
            func=self._analyze_text,
            description="Analyse et extrait des informations d'un texte"
        ))
'''
        
        base_code += '''        
        return tools
    
    async def execute_task(self, task: str) -> str:
        """
        Exécute une tâche donnée
        
        Args:
            task: Description de la tâche à effectuer
            
        Returns:
            Résultat de l'exécution
        """
        print(f"\\n🎯 Tâche : {task}")
        print("🤖 Agent en action...\\n")
        
        try:
            result = await asyncio.to_thread(
                self.agent.run,
                input=task
            )
            
            print(f"\\n✅ Tâche terminée !")
            return result
            
        except Exception as e:
            print(f"\\n❌ Erreur : {e}")
            return f"Erreur : {e}"
    
    # Implémentation des outils (à personnaliser)
    
    def _web_search(self, query: str) -> str:
        """Recherche web simple"""
        # TODO: Intégrer une vraie API de recherche
        return f"Résultats de recherche pour : {query}"
    
    def _analyze_text(self, text: str) -> str:
        """Analyse de texte"""
        return f"Analyse : {len(text)} caractères"
    
    # Ajouter d'autres méthodes selon les besoins

# Point d'entrée
if __name__ == "__main__":
    print("🤖 Démarrage de l'agent IA autonome...")
    print("=" * 60)
    
    # Créer l'agent
    agent = AutonomousAgent()
    
    # Mode interactif
    print("\\n💬 Mode interactif - Tapez 'quit' pour quitter\\n")
    
    while True:
        task = input("Toi : ")
        
        if task.lower() in ['quit', 'exit', 'q']:
            print("👋 Au revoir !")
            break
        
        if not task.strip():
            continue
        
        # Exécuter la tâche
        result = asyncio.run(agent.execute_task(task))
        print(f"\\nAgent : {result}\\n")
'''
        
        return base_code
    
    def _generate_requirements(self, agent_type: str) -> str:
        """Génère requirements.txt"""
        base_reqs = """# Agent IA Autonome - Dépendances
langchain==0.1.0
openai==1.0.0
python-dotenv==1.0.0
asyncio
pyyaml
"""
        
        if agent_type == 'betting':
            base_reqs += """
# Betting specific
requests==2.31.0
beautifulsoup4==4.12.0
pandas==2.1.0
numpy==1.24.0
scikit-learn==1.3.0
"""
        
        elif agent_type == 'automation':
            base_reqs += """
# Automation specific
pyautogui==0.9.54
psutil==5.9.0
"""
        
        return base_reqs
    
    def _generate_config(self, agent_type: str) -> str:
        """Génère config.yaml"""
        return f"""# Configuration de l'agent IA
agent:
  name: "Agent IA Autonome"
  type: "{agent_type}"
  model: "gpt-4o-mini"
  temperature: 0.7
  max_iterations: 10

memory:
  type: "buffer"
  max_messages: 50

tools:
  enabled: true
  timeout: 30

logging:
  level: "INFO"
  file: "agent.log"
"""
    
    def _generate_readme(self, description: str, agent_type: str) -> str:
        """Génère README.md"""
        return f"""# 🤖 Agent IA Autonome

{description}

Généré par **ADJ KILLAGAIN IA 2.0**

## 📋 Description

Cet agent IA autonome utilise LangChain et GPT-4o-mini pour exécuter des tâches complexes de manière intelligente.

## 🚀 Installation

### Prérequis
- Python 3.8+
- Clé API OpenAI

### Installation rapide

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Configurer la clé API
export OPENAI_API_KEY="votre-clé-api"

# 3. Lancer l'agent
python agent.py
```

## 💬 Utilisation

### Mode Interactif
```bash
python agent.py
```

Puis discutez avec l'agent :
```
Toi : Analyse les matchs de ce week-end
Agent : [Analyse en cours...]
```

### Mode Script
```python
from agent import AutonomousAgent

# Créer l'agent
agent = AutonomousAgent(api_key="votre-clé")

# Exécuter une tâche
import asyncio
result = asyncio.run(agent.execute_task("Analyse les données"))
print(result)
```

## 🛠️ Personnalisation

### Ajouter des outils

Éditez `agent.py` et ajoutez vos outils dans `_setup_tools()` :

```python
tools.append(Tool(
    name="Mon Outil",
    func=self._mon_outil,
    description="Description de mon outil"
))
```

### Modifier la configuration

Éditez `config.yaml` pour changer :
- Le modèle IA
- Le nombre d'itérations max
- Les paramètres de logging

## 📊 Fonctionnalités

- ✅ Exécution de tâches autonomes
- ✅ Mémoire de conversation
- ✅ Outils personnalisables
- ✅ Logging détaillé
- ✅ Mode interactif

## ⚠️ Notes Importantes

- **Clé API** : Nécessite une clé OpenAI valide
- **Coûts** : Les appels API sont facturés par OpenAI
- **Sécurité** : Vérifiez les commandes avant exécution

## 🎁 Améliorations Possibles

- Ajouter plus d'outils spécifiques
- Intégrer des bases de données
- Créer une interface graphique
- Déployer sur un serveur

---

**Créé avec 💜 par ADJ KILLAGAIN IA 2.0**
"""
    
    def _generate_tools(self, agent_type: str) -> str:
        """Génère tools.py avec outils spécifiques"""
        if agent_type == 'betting':
            return '''"""
TOOLS POUR BETTING AI
Outils spécialisés pour l'analyse de paris sportifs
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from typing import Dict, Any

def scrape_match_data(match_id: str) -> Dict[str, Any]:
    """Scrape les données d'un match"""
    # TODO: Implémenter le scraping réel
    return {
        'match_id': match_id,
        'team1': 'PSG',
        'team2': 'Lyon',
        'stats': {}
    }

def analyze_match(match_data: Dict) -> Dict:
    """Analyse un match et calcule les probabilités"""
    # TODO: Implémenter l'analyse ML
    return {
        'team1_win': 0.65,
        'draw': 0.20,
        'team2_win': 0.15
    }

def recommend_bet(analysis: Dict) -> str:
    """Recommande un pari"""
    # TODO: Logique de recommandation
    return "Pari recommandé : Team 1 gagne (Confiance: 65%)"
'''
        
        return ""
    
    def _generate_installer(self) -> str:
        """Génère install.sh"""
        return """#!/bin/bash
# Installation automatique de l'agent IA

echo "🤖 Installation de l'agent IA autonome..."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

echo "✅ Python 3 détecté"

# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Pour lancer l'agent :"
echo "  source venv/bin/activate"
echo "  python agent.py"
"""


# Instance globale
ai_agent_generator = AIAgentGenerator()

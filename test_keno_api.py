#!/usr/bin/env python3
"""
🎲 TEST CRÉATION PROJET KENO VIA API
Teste l'authentification et crée un projet d'analyse Keno
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001"
CREDENTIALS = {
    "email": "admin@darknexus.ai",
    "password": "DarkNexus2042!"
}

class KenoTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        
    def login(self):
        """Se connecter à l'API"""
        print("\n🔐 Étape 1: Connexion...")
        try:
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user', {}).get('id')
                print(f"✅ Connecté! Token: {self.token[:20]}...")
                print(f"   User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Erreur login: {response.status_code}")
                print(f"   {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("❌ Erreur: Impossible de se connecter au serveur")
            print(f"   Assure-toi que le backend est lancé sur {BASE_URL}")
            return False
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    def create_keno_project(self):
        """Crée un projet d'analyse Keno"""
        print("\n🎲 Étape 2: Créer le projet Keno...")
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        project_data = {
            "name": "Analyseur de Probabilités Keno",
            "description": """Application d'analyse des probabilités au Keno pour les prochains tirages.

Fonctionnalités:
- Historique des 100 derniers tirages
- Calcul des probabilités par numéro
- Identification des numéros chauds (souvent sortis)
- Identification des numéros froids (rarement sortis)
- Statistiques détaillées par plage horaire
- Suggestions de paris basées sur les patterns
- Graphiques d'évolution des probabilités
- Notifications push pour numéros chauds/froids

Stack technique recommandé:
- Frontend: React 18 + Chart.js pour les graphiques
- Backend: FastAPI + PostgreSQL pour l'historique
- ML: Scikit-learn pour analyse prédictive
- Real-time: WebSocket pour données live""",
            "type": "ai-app",
            "tech_stack": "React,FastAPI,PostgreSQL,Scikit-learn,Chart.js,WebSocket",
            "is_pwa": True,
            "ai_model": "gpt-4o"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/api/projects",
                json=project_data,
                headers=headers,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                project_id = data.get('id')
                print(f"✅ Projet créé!")
                print(f"   ID: {project_id}")
                print(f"   Nom: {data.get('name')}")
                print(f"   Status: {data.get('status')}")
                print(f"\n⏳ Le code est en cours de génération...")
                print(f"   Attends 30-60 secondes puis vérifie le statut.")
                
                return project_id
            else:
                print(f"❌ Erreur création: {response.status_code}")
                print(f"   {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return None
    
    def check_project_status(self, project_id):
        """Vérifie le statut de génération du projet"""
        print(f"\n📊 Étape 3: Vérifier le statut...")
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/projects/{project_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status')
                print(f"✅ Projet trouvé!")
                print(f"   Status: {status}")
                
                if status == "completed":
                    print(f"   Code généré: {len(data.get('code_files', []))} fichiers")
                    return True
                elif status == "generating":
                    print(f"   ⏳ Toujours en cours de génération...")
                    return False
                else:
                    print(f"   ⚠️  Status: {status}")
                    return False
            else:
                print(f"❌ Erreur: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return False
    
    def get_projects_list(self):
        """Liste tous les projets de l'utilisateur"""
        print(f"\n📋 Étape 4: Lister les projets...")
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/projects",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                projects = response.json()
                print(f"✅ {len(projects)} projet(s) trouvé(s):")
                for i, p in enumerate(projects, 1):
                    print(f"   {i}. {p.get('name')} ({p.get('id')[:8]}...)")
                    print(f"      Status: {p.get('status')}")
                return projects
            else:
                print(f"❌ Erreur: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return []
    
    def run(self):
        """Lance le test complet"""
        print("""
╔════════════════════════════════════════════════════╗
║   🎲 TEST CRÉATION PROJET KENO VIA API 🎲        ║
╚════════════════════════════════════════════════════╝
        """)
        
        # 1. Login
        if not self.login():
            print("\n❌ Impossible de se connecter. Arrêt.")
            return False
        
        # 2. Créer le projet
        project_id = self.create_keno_project()
        if not project_id:
            print("\n❌ Impossible de créer le projet. Arrêt.")
            return False
        
        # 3. Vérifier le statut immédiatement
        self.check_project_status(project_id)
        
        # 4. Lister les projets
        self.get_projects_list()
        
        print(f"""
╔════════════════════════════════════════════════════╗
║              ✅ TEST TERMINÉ ✅                   ║
╠════════════════════════════════════════════════════╣
║ Projet créé: Analyseur de Probabilités Keno      ║
║ ID: {project_id}                               ║
║                                                  ║
║ Les fichiers sont en cours de génération...      ║
║ Vérifie le statut dans 30-60 secondes           ║
╚════════════════════════════════════════════════════╝
        """)
        
        return True

if __name__ == "__main__":
    tester = KenoTester()
    tester.run()

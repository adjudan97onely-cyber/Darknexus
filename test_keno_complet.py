#!/usr/bin/env python3
"""
🎲 TEST COMPLET DE CRÉATION PROJET KENO
1. Inscription (register)
2. Connexion (login)
3. Création projet Keno
4. Vérification statut
"""

import requests
import json
import time
import sys

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
    
    def register(self):
        """S'inscrire"""
        print("\n📝 Étape 1: Inscription...")
        try:
            response = self.session.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": CREDENTIALS["email"],
                    "password": CREDENTIALS["password"]
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user', {}).get('id') if isinstance(data.get('user'), dict) else data.get('id')
                print(f"✅ Inscrit! Token: {self.token[:20] if self.token else 'N/A'}...")
                return True
            elif response.status_code == 409:
                print(f"⚠️  Utilisateur déjà existant - essai connexion...")
                return True
            else:
                print(f"❌ Erreur: {response.status_code}")
                print(f"   {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("❌ Serveur non accessible")
            return False
        except Exception as e:
            print(f"❌ Exception: {e}")
            return False
    
    def login(self):
        """Se connecter à l'API"""
        print("\n🔐 Étape 2: Connexion...")
        try:
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                
                # Vérifier structure de la réponse
                if 'user' in data:
                    user_data = data['user']
                    if isinstance(user_data, dict):
                        self.user_id = user_data.get('id')
                    else:
                        self.user_id = user_data
                else:
                    self.user_id = data.get('id') or 'unknown'
                
                print(f"✅ Connecté!")
                print(f"   Token: {self.token[:30]}...")
                print(f"   User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Erreur: {response.status_code}")
                print(f"   {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return False
    
    def create_keno_project(self):
        """Crée le projet Keno"""
        print("\n🎲 Étape 3: Créer le projet Keno...")
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        project_data = {
            "name": "Analyseur Keno - Probabilités",
            "description": """Outil d'analyse des résultats Keno pour prédire les prochains tirages.

Analyse statistique complète:
- Tracking 100 derniers tirages
- Calcul probabilités par numéro (0-69)
- Numéros chauds vs froids
- Distribution par tranches horaires
- Recommandations de jeu

Stack: React + FastAPI + PostgreSQL""",
            "type": "ai-app",
            "is_pwa": True
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
                print(f"   Statut: {data.get('status')}")
                print(f"\n⏳ Code en cours de génération (30-60s)...")
                return project_id
            else:
                print(f"❌ Erreur: {response.status_code}")
                print(f"   {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return None
    
    def check_status(self, project_id):
        """Vérifie le statut"""
        print(f"\n📊 Étape 4: Vérifier le statut...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/projects/{project_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status')
                print(f"✅ Trouvé!")
                print(f"   Status: {status}")
                
                if status == "completed":
                    print(f"   ✨ Génération terminée!")
                    return True
                elif status == "generating":
                    print(f"   ⏳ Toujours en cours...")
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
    
    def list_projects(self):
        """Liste les projets"""
        print(f"\n📋 Étape 5: Liste des projets...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/projects",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                projects = response.json()
                print(f"✅ {len(projects)} projet(s):")
                for p in projects:
                    print(f"   - {p.get('name')} ({p.get('status')})")
                return projects
            else:
                print(f"❌ Erreur: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            return []
    
    def run(self):
        """Lance le test"""
        print("""
╔═══════════════════════════════════════════════════╗
║    🎲 TEST KENO - ENDPOINT API COMPLET 🎲        ║
╚═══════════════════════════════════════════════════╝
        """)
        
        # 1. Register
        if not self.register():
            print("\n❌ Inscription échouée")
        
        # 2. Login
        if not self.login():
            print("\n❌ Connexion échouée. Arrêt.")
            return False
        
        # 3. Créer projet
        project_id = self.create_keno_project()
        if not project_id:
            print("\n❌ Création échouée. Arrêt.")
            return False
        
        # 4. Vérifier status
        self.check_status(project_id)
        
        # 5. Lister
        self.list_projects()
        
        print(f"""
╔═══════════════════════════════════════════════════╗
║           ✅ TEST TERMINÉ ✅                    ║
╠═══════════════════════════════════════════════════╣
║ Projet Keno créé et en cours de génération      ║
║ ID: {project_id}                               ║
║ Reviens dans 1 minute pour voir le résultat    ║
╚═══════════════════════════════════════════════════╝
        """)
        
        return True

if __name__ == "__main__":
    tester = KenoTester()
    tester.run()

"""
TEST SCRIPT - Create Keno Probability Calculator Project
Crée un projet d'application Keno via l'API Darknexus
"""

import requests
import json
import time
import sys
sys.path.insert(0, '.')

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print('='*60)

def main():
    print_section("DARKNEXUS KENO PROJECT CREATION TEST")
    
    # 1. Register user
    print_section("1️⃣  CREATING USER ACCOUNT")
    try:
        register_data = {
            "email": "keno.analyst@darknexus.ai",
            "password": "Keno2024@Secure"
        }
        
        print(f"📧 Email: {register_data['email']}")
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data,
            timeout=10
        )
        
        if response.status_code == 200:
            register_response = response.json()
            token = register_response.get('access_token')
            print(f"✅ User créé avec succès!")
            print(f"🔑 Token: {token[:50]}...")
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(f"   Response: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
        print(f"   Est-ce que le serveur backend fonctionne?")
        print(f"   Essayez: python server.py dans le dossier backend/")
        return
    
    # 2. Create Keno project
    print_section("2️⃣  CREATING KENO PROJECT")
    
    project_data = {
        "name": "Keno Probability Calculator",
        "description": """Application intelligente de calcul des probabilités au Keno:

FONCTIONNALITÉS PRINCIPALES:
1. Analyse des tirages précédents (historique complet)
2. Calcul des probabilités pour les prochains tirages
3. Identification des numéros chauds/froids
4. Suggestions de combinaisons basées sur l'IA
5. Dashboard temps réel avec statistiques
6. Notifications pour les patterns détectés

TECHNOLOGIES:
- Frontend: React 18 + Tailwind CSS
- Backend: Node.js + Express
- Analyse: Python avec numpy/scipy
- Database: MongoDB pour historique
- Charts: Chart.js ou Plotly

CARACTÉRISTIQUES SPÉCIALES:
- Machine Learning pour prédictions
- API mise à jour automatiquement après chaque tirage
- Comparaison avec d'autres joueurs
- Stratégies d'optimisation de gains""",
        "type": "web-app",
        "tech_stack": "React,Node.js,MongoDB,Machine Learning",
        "is_pwa": True,
        "ai_model": "gpt-4o"
    }
    
    print(f"📱 Nom du projet: {project_data['name']}")
    print(f"🎯 Type: {project_data['type']}")
    print(f"📊 Description: {project_data['description'][:100]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json=project_data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            project_response = response.json()
            project_id = project_response.get('id')
            print(f"✅ Projet créé avec succès!")
            print(f"🆔 Project ID: {project_id}")
            print(f"📊 Status: {project_response.get('status')}")
            
        else:
            print(f"❌ Erreur création: {response.status_code}")
            print(f"   Response: {response.text}")
            return
            
    except requests.ConnectionError:
        print(f"❌ Impossible de se connecter au serveur")
        print(f"   Assurez-vous que le backend tourne: python server.py")
        return
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return
    
    # 3. Check project status
    print_section("3️⃣  CHECKING PROJECT STATUS")
    
    print("⏳ Attente de la génération du code par l'IA...")
    
    for i in range(12):  # Try for 1 minute
        try:
            response = requests.get(
                f"{BASE_URL}/api/projects/{project_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                project = response.json()
                status = project.get('status')
                print(f"   [{i+1}/12] Statut: {status}", end='\r')
                
                if status == 'completed':
                    print(f"\n✅ Génération complète!")
                    print(f"\n📄 Fichiers générés:")
                    
                    code_files = project.get('code_files', [])
                    for file in code_files[:5]:  # Show first 5
                        print(f"   - {file.get('filename')} ({file.get('language')})")
                    
                    if len(code_files) > 5:
                        print(f"   ... et {len(code_files)-5} autres fichiers")
                    
                    print(f"\n🤖 Modèle utilisé: {project.get('ai_model_used')}")
                    print(f"🏗️  Tech stack: {', '.join(project.get('tech_stack', []))}")
                    
                    return
                    
        except Exception as e:
            print(f"   Erreur vérification: {e}")
            break
        
        time.sleep(5)
    
    print(f"\n⏱️  Timeout - La génération peut prendre plus de temps")
    print(f"   Vérifiez le statut plus tard avec le project ID: {project_id}")

if __name__ == "__main__":
    main()

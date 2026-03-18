#!/usr/bin/env python3
"""Test du fix - vérifier que GET /api/projects/{id} fonctionne"""

import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDdjNGI2Mi1lZWU4LTQwZDAtODg1NS1jZTJkYWJiNjNmZTMiLCJleHAiOjE3NDU3MzIzMTAsImVtYWlsIjoiYWRtaW5AZGFya25leHVzLmFpIn0.TwmYCllI7UVPpM_yeCPpUl8KxrKuRxW3RkQFNlqB4KQ"
PROJECT_ID = "8326ae3b-4d26-45c5-a174-fa016dbd381b"

print("\n🧪 Test du fix: GET /api/projects/{id}\n")
print(f"Testing: GET /api/projects/{PROJECT_ID}")
print(f"Token: {TOKEN[:30]}...\n")

try:
    response = requests.get(
        f"http://localhost:8001/api/projects/{PROJECT_ID}",
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=5
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCÈS! Le projet a été trouvé:")
        print(f"   Nom: {data.get('name')}")
        print(f"   ID: {data.get('id')}")
        print(f"   Statut: {data.get('status')}")
        print(f"   Type: {data.get('type')}")
        print(f"   Tech Stack: {data.get('tech_stack')}")
        print(f"   Fichiers: {len(data.get('code_files', []))} fichiers")
        
        if data.get('code_files'):
            print(f"\n   📁 Fichiers générés:")
            for f in data.get('code_files', [])[:5]:
                print(f"      - {f.get('filename')} ({f.get('language')})")
        
    elif response.status_code == 404:
        print(f"\n⚠️  Projet non trouvé (404)")
        print(f"   Message: {response.json().get('detail')}")
    
    else:
        print(f"\n❌ Erreur {response.status_code}")
        print(f"   {response.text[:200]}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Erreur réseau: {e}")
    print("\n💡 Le serveur est-il en cours d'exécution?")
    print("   Lance: python -m uvicorn server:app --port 8001 --reload")

print("\n")

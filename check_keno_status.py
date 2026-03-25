#!/usr/bin/env python3
import requests
import time

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDdjNGI2Mi1lZWU4LTQwZDAtODg1NS1jZTJkYWJiNjNmZTMiLCJleHAiOjE3NDU3MzIzMTAsImVtYWlsIjoiYWRtaW5AZGFya25leHVzLmFpIn0.TwmYCllI7UVPpM_yeCPpUl8KxrKuRxW3RkQFNlqB4KQ"

print("\n⏳ Vérification du statut du projet Keno (toutes les 8 secondes)...\n")

for i in range(6):
    try:
        resp = requests.get(
            "http://localhost:8001/api/projects",
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=5
        )
        projects = resp.json()
        keno = [p for p in projects if "Keno" in p.get("name", "")]
        
        if keno:
            status = keno[0]["status"]
            name = keno[0]["name"]
            
            symbol = "✅" if status == "completed" else "⏳" if status == "generating" else "❓"
            print(f"[{i+1}/6] {symbol} Status: {status:12} - {name}")
            
            if status == "completed":
                print("\n✨ PROJET GÉNÉRÉ! Détails:")
                print(f"   Nom: {keno[0].get('name')}")
                print(f"   ID: {keno[0].get('id')}")
                print(f"   Type: {keno[0].get('type')}")
                print(f"   Tech Stack: {keno[0].get('tech_stack', 'N/A')}")
                
                # Afficher les fichiers si disponibles
                if 'code_files' in keno[0]:
                    files = keno[0]['code_files']
                    print(f"\n   📁 Fichiers générés ({len(files)}):")
                    for f in files[:5]:  # Afficher max 5
                        print(f"      - {f.get('name', 'N/A')}")
                    if len(files) > 5:
                        print(f"      ... et {len(files)-5} de plus")
                break
        
        if i < 5:
            time.sleep(8)
            
    except requests.exceptions.RequestException as e:
        print(f"[{i+1}/6] ❌ Erreur réseau: {e}")
    except Exception as e:
        print(f"[{i+1}/6] ❌ Erreur: {e}")

print("\n✅ Vérification terminée\n")

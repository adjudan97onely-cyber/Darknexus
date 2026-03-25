#!/usr/bin/env python3
import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDdjNGI2Mi1lZWU4LTQwZDAtODg1NS1jZTJkYWJiNjNmZTMiLCJleHAiOjE3NDU3MzIzMTAsImVtYWlsIjoiYWRtaW5AZGFya25leHVzLmFpIn0.TwmYCllI7UVPpM_yeCPpUl8KxrKuRxW3RkQFNlqB4KQ"
PROJECT_ID = "8326ae3b-4d26-45c5-a174-fa016dbd381b"

print("\n🧪 Test du nouvel endpoint /preview-html\n")

resp = requests.get(
    f"http://localhost:8001/api/projects/{PROJECT_ID}/preview-html",
    headers={"Authorization": f"Bearer {TOKEN}"},
    timeout=5
)

if resp.status_code == 200:
    html = resp.text
    print("✅ Endpoint /preview-html fonctionne!")
    print(f"Size: {len(html)} bytes")
    print(f"Contient React CDN: {'unpkg.com/react' in html}")
    print(f"Contient Tailwind: {'tailwindcss' in html}")
    print(f"Contient le nom du projet: {'Analyseur Keno' in html}")
    
    # Sauvegarder dans un fichier pour affichage
    with open("preview_test.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("\n✅ Fichier de test sauvegardé: preview_test.html")
    
else:
    print(f"❌ Erreur {resp.status_code}")
    print(resp.text[:500])

print()

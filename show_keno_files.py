#!/usr/bin/env python3
"""Affiche les fichiers générés pour le projet Keno"""

import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDdjNGI2Mi1lZWU4LTQwZDAtODg1NS1jZTJkYWJiNjNmZTMiLCJleHAiOjE3NDU3MzIzMTAsImVtYWlsIjoiYWRtaW5AZGFya25leHVzLmFpIn0.TwmYCllI7UVPpM_yeCPpUl8KxrKuRxW3RkQFNlqB4KQ"
PROJECT_ID = "8326ae3b-4d26-45c5-a174-fa016dbd381b"

resp = requests.get(
    f"http://localhost:8001/api/projects/{PROJECT_ID}",
    headers={"Authorization": f"Bearer {TOKEN}"},
    timeout=5
)

data = resp.json()
print("\n📁 FICHIERS GÉNÉRÉS POUR LE PROJET KENO")
print("=" * 70)

for i, f in enumerate(data.get("code_files", []), 1):
    filename = f["filename"]
    language = f["language"]
    content = f["content"]
    
    print(f"\n[{i:2}] 📄 {filename}")
    print(f"     Type: {language}")
    print(f"     Taille: {len(content)} caractères")
    
    # Afficher un aperçu
    lines = content.split('\n')
    preview = '\n'.join(lines[:5])
    print(f"     Aperçu:")
    for line in preview.split('\n'):
        print(f"       {line[:60]}")
    if len(lines) > 5:
        print(f"       ... ({len(lines)} lignes totales)")

print("\n" + "=" * 70)
print(f"✅ Total: {len(data.get('code_files', []))} fichiers générés")

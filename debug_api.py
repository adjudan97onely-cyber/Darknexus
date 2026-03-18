import requests
import json

# Test l'API avec plus de détails
r = requests.get('http://localhost:5000/api/projects')
print(f'Status: {r.status_code}')
print(f'Headers: {dict(r.headers)}')
print(f'\nProjects list length: {len(r.json())}')

projects = r.json()
print(f'\nProjets retournés ({len(projects)}):')
for p in projects:
    print(f'  - {p.get("name")} (id: {p.get("id")[:8]}...)')

print(f'\n❌ Manquants:')
print(f'  - Calculatrice Simple')
print(f'  - Todo App - Test Preview')

print(f'\n📊 JSON complet:')
print(json.dumps(r.json(), indent=2, ensure_ascii=False)[:1000])

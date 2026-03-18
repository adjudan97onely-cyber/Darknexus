import requests

# Test l'API /api/projects
r = requests.get('http://localhost:5000/api/projects')
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:500]}')

if r.status_code == 200:
    projects = r.json()
    print(f'\n✅ Projets retournés: {len(projects)}')
    for p in projects:
        print(f'  📦 {p.get("name", "Unknown")} (ID: {p.get("id", "?")[:8]}...)')
else:
    print(f'❌ Erreur: {r.status_code}')

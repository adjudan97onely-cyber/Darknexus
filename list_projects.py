import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_projects():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects = db['projects']
        
        count = await projects.count_documents({})
        print(f'Nombre de projets: {count}\n')
        
        all_projects = await projects.find({}, {'_id': 0, 'id': 1, 'name': 1, 'type': 1, 'description': 1, 'code_files': 1}).to_list(None)
        
        for proj in all_projects:
            desc = proj.get('description', 'N/A')
            if desc:
                desc = desc[:60]
            
            code_files = proj.get('code_files', [])
            has_jsx = any(f.get('filename', '').endswith('.jsx') for f in code_files)
            has_html = any(f.get('filename', '').endswith('.html') for f in code_files)
            
            print(f'📦 Nom: {proj["name"]}')
            print(f'🔗 ID: {proj["id"][:8]}...')
            print(f'📝 Type: {proj["type"]}')
            print(f'📄 Description: {desc}...')
            print(f'📋 Fichiers: {len(code_files)} fichiers')
            print(f'⚛️ JSX: {"Oui ❌ (React - no preview)" if has_jsx else "Non ✅"}')
            print(f'🌐 HTML: {"Oui ✅" if has_html else "Non"}')
            print('---')
        
        client.close()
    except Exception as e:
        print(f'Erreur: {e}')

asyncio.run(list_projects())

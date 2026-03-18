import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_project_structure():
    """Inspecte la structure complète d'un projet existant"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects = db['projects']
        
        # Récupère TOUS les projets en entier
        all_projects = await projects.find({}).to_list(None)
        
        for proj in all_projects:
            print(f"\n{'='*60}")
            print(f"📦 Projet: {proj['name']}")
            print(f"ID: {proj['id'][:8]}...")
            print(f"\nChamps du projet:")
            for key in sorted(proj.keys()):
                if key == '_id':
                    continue
                value = proj[key]
                if key == 'code_files':
                    print(f"  {key}: {len(value)} fichiers")
                elif key in ['created_at', 'updated_at']:
                    print(f"  {key}: {value}")
                elif isinstance(value, str) and len(value) > 50:
                    print(f"  {key}: {value[:50]}...")
                elif isinstance(value, list):
                    print(f"  {key}: {value}")
                else:
                    print(f"  {key}: {value}")
        
        client.close()
        
    except Exception as e:
        print(f'Erreur: {e}')

asyncio.run(check_project_structure())

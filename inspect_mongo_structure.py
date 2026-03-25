import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def inspect_mongodb_structure():
    """Inspecte la structure exacte de chaque projet en BD"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects_collection = db['projects']
        
        # Récupère TOUS les projets
        all_projects = await projects_collection.find({}).to_list(None)
        
        for proj in all_projects:
            print(f"\n{'='*60}")
            print(f"📦 {proj['name']}")
            print(f"{'='*60}")
            
            # Affiche les clés et types
            for key in sorted(proj.keys()):
                value = proj[key]
                
                # Affiche différemment selon le type
                if key == '_id':
                    print(f"  {key}: {value}")
                elif key == 'code_files':
                    print(f"  {key}: {len(value)} fichiers")
                    for cf in value[:1]:  # Affiche le premier fichier seulement
                        print(f"    - {cf.get('filename')}: {len(cf.get('content', ''))} chars")
                elif key in ['created_at', 'updated_at']:
                    print(f"  {key}: {value}")
                elif isinstance(value, str) and len(value) > 100:
                    print(f"  {key}: {value[:100]}...")
                else:
                    print(f"  {key}: {value}")
        
        client.close()
        
    except Exception as e:
        print(f'Erreur: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(inspect_mongodb_structure())

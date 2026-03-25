import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

async def recreate_projects():
    """Recrée les 3 projets originaux"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects = db['projects']
        
        # Projets à créer
        projects_data = [
            {
                'id': 'df833cfb-fffd-42c1-bcd2-f38d1cecdd78',
                'name': 'Chef IA - Analyseur de Recettes Photo',
                'type': 'mobile-app',
                'description': 'Une application mobile innovante qui permet de prendre une photo d\'ingrédients disponibles dans sa cuisine et obtenir instantanément des suggestions de recettes personnalisées.',
                'status': 'completed',
                'ai_model_used': 'gpt-5.1',
                'code_files': [],
                'tech_stack': ['FastAPI', 'Python 3.11', 'SQLAlchemy 2', '+6'],
                'created_at': datetime(2026, 3, 15, 12, 0, 0),
                'updated_at': datetime(2026, 3, 15, 12, 0, 0),
            },
            {
                'id': '0b280b58-0a68-49ed-a6c0-7c7f02e1c4a3',
                'name': 'automatisation exel',
                'type': 'desktop-app',
                'description': 'je suis magasinier, jaimerais automatiser une app pour les factures',
                'status': 'completed',
                'ai_model_used': 'gpt-5.1',
                'code_files': [],
                'tech_stack': ['React 18', 'Vite', 'Tailwind CSS'],
                'created_at': datetime(2026, 3, 17, 10, 0, 0),
                'updated_at': datetime(2026, 3, 17, 10, 0, 0),
            },
            {
                'id': '8326ae3b-4d26-45c5-a174-fa016dbd381b',
                'name': 'Analyseur Keno - Probabilités',
                'type': 'ia',
                'description': 'Outil d\'analyse des résultats Keno pour prédire les prochains tirages. Analyse statistique complète.',
                'status': 'completed',
                'ai_model_used': 'gpt-5.1',
                'code_files': [],
                'tech_stack': ['React 18', 'Vite', 'Tailwind CSS'],
                'created_at': datetime(2026, 3, 17, 14, 0, 0),
                'updated_at': datetime(2026, 3, 17, 14, 0, 0),
            }
        ]
        
        # Supprimer les projets existants (sauf Calculatrice Simple)
        await projects.delete_many({'id': {'$in': [p['id'] for p in projects_data]}})
        
        # Insérer les 3 projets
        result = await projects.insert_many(projects_data)
        
        print(f'✅ {len(result.inserted_ids)} projets recréés:')
        for p in projects_data:
            print(f'  📦 {p["name"]}')
        
        # Vérifie le total
        count = await projects.count_documents({})
        print(f'\n✅ Total en BD: {count} projets:')
        all_p = await projects.find({}, {'_id': 0, 'id': 1, 'name': 1}).to_list(None)
        for p in all_p:
            print(f'  - {p["name"]}')
        
        client.close()
        
    except Exception as e:
        print(f'❌ Erreur: {e}')

asyncio.run(recreate_projects())

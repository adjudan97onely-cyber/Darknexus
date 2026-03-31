"""
Database Configuration - TinyDB (Simple & Compatible)
Stockage local des prédictions et résultats
"""

from tinydb import TinyDB
from pathlib import Path
import logging
import os

logger = logging.getLogger(__name__)

# Déterminer le chemin de la DB
DB_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'databases')
os.makedirs(DB_FOLDER, exist_ok=True)

DB_PATH = os.path.join(DB_FOLDER, 'predictions.json')

# Instance globale
_db = None


def get_db():
    """Récupère l'instance TinyDB"""
    global _db
    if _db is None:
        _db = TinyDB(DB_PATH)
        logger.info(f"✅ TinyDB initialized: {DB_PATH}")
    return _db


def init_db():
    """Initialise la base de données"""
    try:
        db = get_db()
        
        # Créer les tables (collections)
        db.table('predictions')
        db.table('results')
        db.table('evaluations')
        db.table('cache')
        
        logger.info("✅ TinyDB initialized with tables: predictions, results, evaluations, cache")
        return True
    except Exception as e:
        logger.error(f"❌ Database init error: {e}")
        return False


def get_db_session():
    """Récupère une session DB (compatible ancien code)"""
    return get_db()


def close_db():
    """Ferme la base de données"""
    global _db
    if _db is not None:
        _db.close()
        _db = None
        logger.info("✅ Database closed")


# Fonctions utilitaires

def save_prediction(prediction_data):
    """Sauvegarde une prédiction"""
    try:
        db = get_db()
        table = db.table('predictions')
        table.insert(prediction_data)
        logger.info(f"✅ Prediction saved")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving prediction: {e}")
        return False


def get_predictions():
    """Récupère toutes les prédictions"""
    try:
        db = get_db()
        table = db.table('predictions')
        return table.all()
    except Exception as e:
        logger.error(f"❌ Error getting predictions: {e}")
        return []


def save_result(result_data):
    """Sauvegarde un résultat"""
    try:
        db = get_db()
        table = db.table('results')
        table.insert(result_data)
        return True
    except Exception as e:
        logger.error(f"❌ Error saving result: {e}")
        return False


def cache_api_response(endpoint, response_data):
    """Cache une réponse API"""
    try:
        db = get_db()
        table = db.table('cache')
        from datetime import datetime
        table.insert({
            'endpoint': endpoint,
            'data': response_data,
            'timestamp': str(datetime.now())
        })
        return True
    except Exception as e:
        logger.error(f"❌ Error caching response: {e}")
        return False


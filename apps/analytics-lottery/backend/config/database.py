"""
Configuration SQLite pour Analyseur de Loteries
SQLite utilisé car MongoDB n'est pas disponible localement
Adapter MongoDB-like pour compatibilité avec code existant
"""
import sqlite3
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from .db_adapter import wrap_sqlite_db, SQLiteDB

# Charger les variables d'environnement depuis le fichier .env dans config/
load_dotenv(Path(__file__).parent / ".env")

DB_PATH = os.getenv("DB_PATH", "lottery_analyzer.db")
db: SQLiteDB = None
_raw_connection: sqlite3.Connection = None

# Schéma SQLite
SCHEMA = {
    "draws": """
        CREATE TABLE IF NOT EXISTS draws (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_type TEXT NOT NULL,
            numbers TEXT NOT NULL,
            date TEXT NOT NULL,
            bonus INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "analysis": """
        CREATE TABLE IF NOT EXISTS analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_type TEXT NOT NULL,
            frequency TEXT NOT NULL,
            anomalies TEXT NOT NULL,
            mean_appearance REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "recommendations": """
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_type TEXT NOT NULL,
            numbers TEXT NOT NULL,
            score REAL NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "matches": """
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sport TEXT NOT NULL,
            home_team TEXT NOT NULL,
            away_team TEXT NOT NULL,
            date TEXT NOT NULL,
            league TEXT,
            goals_home INTEGER DEFAULT 0,
            goals_away INTEGER DEFAULT 0,
            result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "predictions": """
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            prediction TEXT NOT NULL,
            probability REAL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
}


async def connect_db():
    """Connecte à SQLite et retourne un adapter MongoDB-like"""
    global db, _raw_connection
    # S'assurer que le répertoire existe
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    
    _raw_connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    _raw_connection.row_factory = sqlite3.Row  # Pour accéder aux colonnes par nom
    
    # Créer les tables
    cursor = _raw_connection.cursor()
    for table_name, schema in SCHEMA.items():
        cursor.execute(schema)
    _raw_connection.commit()
    
    # Wrap SQLite in MongoDB-like adapter
    db = wrap_sqlite_db(_raw_connection)
    
    print(f"[OK] Connected to SQLite: {DB_PATH}")
    return db


async def close_db():
    """Ferme la connexion SQLite"""
    global _raw_connection
    if _raw_connection:
        _raw_connection.close()
        print("[OK] Disconnected from SQLite")


async def get_db():
    """Récupère la DB courante"""
    return db


class DBCollection:
    """Wrapper pour imiter interface MongoDB"""
    def __init__(self, table_name: str):
        self.table_name = table_name
    
    async def find_one(self, query: dict = None):
        cursor = db.cursor()
        if query:
            conditions = " AND ".join([f"{k}=?" for k in query.keys()])
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE {conditions}", list(query.values()))
        else:
            cursor.execute(f"SELECT * FROM {self.table_name} LIMIT 1")
        row = cursor.fetchone()
        return dict(row) if row else None
    
    async def find(self, query: dict = None):
        cursor = db.cursor()
        if query:
            conditions = " AND ".join([f"{k}=?" for k in query.keys()])
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE {conditions}", list(query.values()))
        else:
            cursor.execute(f"SELECT * FROM {self.table_name}")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    
    async def insert_one(self, document: dict):
        cursor = db.cursor()
        columns = ", ".join(document.keys())
        placeholders = ", ".join(["?" for _ in document])
        cursor.execute(f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})", list(document.values()))
        db.commit()
        return {"inserted_id": cursor.lastrowid}
    
    async def insert_many(self, documents: list):
        cursor = db.cursor()
        for doc in documents:
            columns = ", ".join(doc.keys())
            placeholders = ", ".join(["?" for _ in doc])
            cursor.execute(f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})", list(doc.values()))
        db.commit()
        return {"inserted_ids": [d.get('id') for d in documents]}
    
    async def update_one(self, query: dict, update: dict):
        cursor = db.cursor()
        set_clause = ", ".join([f"{k}=?" for k in update.keys()])
        where_clause = " AND ".join([f"{k}=?" for k in query.keys()])
        cursor.execute(f"UPDATE {self.table_name} SET {set_clause} WHERE {where_clause}", 
                      list(update.values()) + list(query.values()))
        db.commit()
        return {"modified_count": cursor.rowcount}
    
    async def delete_one(self, query: dict):
        cursor = db.cursor()
        conditions = " AND ".join([f"{k}=?" for k in query.keys()])
        cursor.execute(f"DELETE FROM {self.table_name} WHERE {conditions}", list(query.values()))
        db.commit()
        return {"deleted_count": cursor.rowcount}
    
    async def count_documents(self, query: dict = None):
        cursor = db.cursor()
        if query:
            conditions = " AND ".join([f"{k}=?" for k in query.keys()])
            cursor.execute(f"SELECT COUNT(*) FROM {self.table_name} WHERE {conditions}", list(query.values()))
        else:
            cursor.execute(f"SELECT COUNT(*) FROM {self.table_name}")
        return cursor.fetchone()[0]
    
    async def delete_many(self, query: dict = None):
        cursor = db.cursor()
        if query:
            conditions = " AND ".join([f"{k}=?" for k in query.keys()])
            cursor.execute(f"DELETE FROM {self.table_name} WHERE {conditions}", list(query.values()))
        else:
            cursor.execute(f"DELETE FROM {self.table_name}")
        db.commit()
        return {"deleted_count": cursor.rowcount}


async def get_draws_collection():
    """Récupère la collection des tirages"""
    return DBCollection("draws")


async def get_analysis_collection():
    """Récupère la collection des analyses"""
    return DBCollection("analysis")


async def get_recommendations_collection():
    """Récupère la collection des recommandations"""
    return DBCollection("recommendations")


async def get_matches_collection():
    """Récupère la collection des matchs sportifs"""
    return db["matches"]


async def get_predictions_collection():
    """Récupère la collection des prédictions sportives"""
    return db["predictions"]

"""
SQLiteDB Adapter - Simule l'interface MongoDB sur SQLite
Permet aux services de continuer à utiliser la syntaxe MongoDB asynce
"""
import sqlite3
import json
from typing import Dict, List, Any, Optional
from datetime import datetime


class Collection:
    """Simule une collection MongoDB avec SQLite en arrière-plan"""
    
    def __init__(self, db: sqlite3.Connection, table_name: str):
        self.db = db
        self.table_name = table_name
    
    async def insert_one(self, document: Dict[str, Any]) -> str:
        """Insère un document et retourne l'ID"""
        try:
            # Préparer les colonnes et valeurs
            columns = list(document.keys())
            placeholders = ",".join(["?" for _ in columns])
            values = tuple(document.values())
            
            query = f"INSERT INTO {self.table_name} ({','.join(columns)}) VALUES ({placeholders})"
            cursor = self.db.cursor()
            cursor.execute(query, values)
            self.db.commit()
            
            return str(cursor.lastrowid)
        except Exception as e:
            print(f"[ERROR] insert_one failed: {e}")
            raise
    
    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        """Compte les documents correspondant à la requête"""
        try:
            if query is None or len(query) == 0:
                cursor = self.db.cursor()
                cursor.execute(f"SELECT COUNT(*) FROM {self.table_name}")
                return cursor.fetchone()[0]
            
            # Construire WHERE clause et valeurs
            where_clause, values = self._build_where_clause(query)
            cursor = self.db.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {self.table_name} WHERE {where_clause}", values)
            return cursor.fetchone()[0]
        except Exception as e:
            print(f"[ERROR] count_documents failed: {e}")
            return 0
    
    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict]:
        """Trouve un document"""
        try:
            if query is None or len(query) == 0:
                cursor = self.db.cursor()
                cursor.execute(f"SELECT * FROM {self.table_name} LIMIT 1")
            else:
                where_clause, values = self._build_where_clause(query)
                cursor = self.db.cursor()
                cursor.execute(f"SELECT * FROM {self.table_name} WHERE {where_clause} LIMIT 1", values)
            
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            print(f"[ERROR] find_one failed: {e}")
            return None
    
    async def find(self, query: Dict[str, Any] = None, limit: int = None) -> List[Dict]:
        """Trouve plusieurs documents"""
        try:
            cursor = self.db.cursor()
            if query is None or len(query) == 0:
                sql = f"SELECT * FROM {self.table_name}"
                cursor.execute(sql)
            else:
                where_clause, values = self._build_where_clause(query)
                sql = f"SELECT * FROM {self.table_name} WHERE {where_clause}"
                cursor.execute(sql, values)
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[ERROR] find failed: {e}")
            return []
    
    async def update_one(self, filter_query: Dict, update_data: Dict) -> int:
        """Met à jour un document"""
        try:
            where_clause, filter_values = self._build_where_clause(filter_query)
            set_clause = ",".join([f"{k}=?" for k in update_data.keys()])
            
            values = tuple(update_data.values()) + tuple(filter_values)
            query = f"UPDATE {self.table_name} SET {set_clause} WHERE {where_clause}"
            
            cursor = self.db.cursor()
            cursor.execute(query, values)
            self.db.commit()
            
            return cursor.rowcount
        except Exception as e:
            print(f"[ERROR] update_one failed: {e}")
            return 0
    
    async def delete_one(self, query: Dict[str, Any]) -> int:
        """Supprime un document"""
        try:
            where_clause, values = self._build_where_clause(query)
            cursor = self.db.cursor()
            cursor.execute(f"DELETE FROM {self.table_name} WHERE {where_clause}", values)
            self.db.commit()
            return cursor.rowcount
        except Exception as e:
            print(f"[ERROR] delete_one failed: {e}")
            return 0
    
    @staticmethod
    def _build_where_clause(query: Dict[str, Any]) -> tuple:
        """Construis une clause WHERE à partir d'une requête MongoDB-like
        Retourne (where_clause_string, values_tuple)"""
        conditions = []
        values = []
        
        for key, value in query.items():
            if isinstance(value, dict):
                # Opérateurs MongoDB-like: $gt, $lt, $eq, etc.
                for op, val in value.items():
                    if op == "$gt":
                        conditions.append(f"{key} > ?")
                        values.append(val)
                    elif op == "$lt":
                        conditions.append(f"{key} < ?")
                        values.append(val)
                    elif op == "$eq":
                        conditions.append(f"{key} = ?")
                        values.append(val)
                    elif op == "$gte":
                        conditions.append(f"{key} >= ?")
                        values.append(val)
                    elif op == "$lte":
                        conditions.append(f"{key} <= ?")
                        values.append(val)
                    elif op == "$ne":
                        conditions.append(f"{key} != ?")
                        values.append(val)
                    else:
                        conditions.append(f"{key} = ?")
                        values.append(val)
            else:
                # Égalité simple
                conditions.append(f"{key} = ?")
                values.append(value)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        return (where_clause, tuple(values))


class SQLiteDB:
    """Adapter SQLite qui simule l'interface MongoDB"""
    
    def __init__(self, connection: sqlite3.Connection):
        self.connection = connection
        self._collections = {}
    
    def __getitem__(self, table_name: str) -> Collection:
        """Permet: db["table_name"]"""
        if table_name not in self._collections:
            self._collections[table_name] = Collection(self.connection, table_name)
        return self._collections[table_name]
    
    def __getattr__(self, table_name: str) -> Collection:
        """Permet: db.table_name"""
        if table_name.startswith("_"):
            raise AttributeError(f"No attribute {table_name}")
        return self[table_name]


def wrap_sqlite_db(sqlite_connection: sqlite3.Connection) -> SQLiteDB:
    """Convertit une connexion SQLite3 en interface MongoDB-like"""
    return SQLiteDB(sqlite_connection)

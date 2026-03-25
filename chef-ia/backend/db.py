import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "chef_ia.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredients_raw TEXT NOT NULL,
                ingredients_normalized TEXT NOT NULL,
                preferences_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER NOT NULL,
                recipe_name TEXT NOT NULL,
                score REAL NOT NULL,
                prep_minutes INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                reason TEXT NOT NULL,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_analysis(ingredients_raw: str, ingredients_normalized: str, preferences_json: str) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO analyses (ingredients_raw, ingredients_normalized, preferences_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (ingredients_raw, ingredients_normalized, preferences_json, datetime.utcnow().isoformat()),
        )
        conn.commit()
        return int(cursor.lastrowid)
    finally:
        conn.close()


def save_recommendations(analysis_id: int, rows: list[dict]) -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.executemany(
            """
            INSERT INTO recommendations (
                analysis_id, recipe_name, score, prep_minutes, difficulty, reason
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    analysis_id,
                    item["recipe_name"],
                    item["score"],
                    item["prep_minutes"],
                    item["difficulty"],
                    item["reason"],
                )
                for item in rows
            ],
        )
        conn.commit()
    finally:
        conn.close()


def get_recent_history(limit: int = 10) -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT a.id, a.ingredients_raw, a.ingredients_normalized, a.preferences_json, a.created_at,
                   r.recipe_name, r.score, r.prep_minutes, r.difficulty, r.reason
            FROM analyses a
            LEFT JOIN recommendations r ON r.analysis_id = a.id
            WHERE a.id IN (
                SELECT id FROM analyses ORDER BY id DESC LIMIT ?
            )
            ORDER BY a.id DESC, r.score DESC
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        grouped: dict[int, dict] = {}
        for row in rows:
            analysis_id = int(row["id"])
            if analysis_id not in grouped:
                grouped[analysis_id] = {
                    "analysis_id": analysis_id,
                    "ingredients_raw": row["ingredients_raw"],
                    "ingredients_normalized": row["ingredients_normalized"],
                    "preferences_json": row["preferences_json"],
                    "created_at": row["created_at"],
                    "recommendations": [],
                }
            if row["recipe_name"] is not None:
                grouped[analysis_id]["recommendations"].append(
                    {
                        "recipe_name": row["recipe_name"],
                        "score": row["score"],
                        "prep_minutes": row["prep_minutes"],
                        "difficulty": row["difficulty"],
                        "reason": row["reason"],
                    }
                )
        return list(grouped.values())
    finally:
        conn.close()


def get_stats() -> dict:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS value FROM analyses")
        total_analyses = int(cursor.fetchone()["value"])

        cursor.execute(
            """
            SELECT recipe_name, COUNT(*) AS value
            FROM recommendations
            GROUP BY recipe_name
            ORDER BY value DESC
            LIMIT 5
            """
        )
        top_recipes = [dict(row) for row in cursor.fetchall()]

        return {
            "total_analyses": total_analyses,
            "top_recipes": top_recipes,
        }
    finally:
        conn.close()

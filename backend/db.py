"""
Couche de données SQLite – prédictions, résultats, poids IA
"""
import sqlite3
import json
import os
from datetime import datetime

if os.environ.get("VERCEL") == "1":
    DB_PATH = "/tmp/lottery_analytics.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "lottery_analytics.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT DEFAULT 'user',
            created_at    TEXT NOT NULL,
            updated_at    TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            plan          TEXT NOT NULL,
            status        TEXT NOT NULL,
            started_at    TEXT NOT NULL,
            expires_at    TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            token         TEXT UNIQUE NOT NULL,
            created_at    TEXT NOT NULL,
            expires_at    TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS lottery_draws (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_type  TEXT NOT NULL,
            draw_date     TEXT NOT NULL,
            numbers       TEXT NOT NULL,
            bonus         INTEGER,
            source        TEXT DEFAULT 'seed',
            created_at    TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS sports_matches (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            country       TEXT NOT NULL,
            league        TEXT NOT NULL,
            match_date    TEXT NOT NULL,
            home_team     TEXT NOT NULL,
            away_team     TEXT NOT NULL,
            home_score    INTEGER,
            away_score    INTEGER,
            status        TEXT DEFAULT 'scheduled',
            source        TEXT DEFAULT 'seed',
            created_at    TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS sync_state (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            domain        TEXT UNIQUE NOT NULL,
            last_sync_at  TEXT,
            source        TEXT,
            status        TEXT,
            message       TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS scheduler_logs (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            job_name      TEXT NOT NULL,
            run_at        TEXT NOT NULL,
            status        TEXT NOT NULL,
            details       TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            type        TEXT    NOT NULL,
            subtype     TEXT,
            data        TEXT,
            prediction  TEXT    NOT NULL,
            confidence  REAL    NOT NULL,
            score       REAL    DEFAULT 0,
            status      TEXT    DEFAULT 'pending',
            created_at  TEXT    NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS results (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            type          TEXT NOT NULL,
            actual_result TEXT NOT NULL,
            draw_date     TEXT NOT NULL,
            source        TEXT DEFAULT 'manual',
            created_at    TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS ai_models (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT UNIQUE NOT NULL,
            weight     REAL DEFAULT 1.0,
            accuracy   REAL DEFAULT 0.5,
            total_runs INTEGER DEFAULT 0,
            wins       INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            type       TEXT NOT NULL,
            message    TEXT NOT NULL,
            is_read    INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    # Modèles IA initiaux
    models = [
        ("frequency_analysis", 1.0),
        ("chi_square",         0.85),
        ("hot_cold_balance",   0.90),
        ("recency_bias",       0.80),
        ("cycle_detection",    0.75),
        ("variance_filter",    0.88),
    ]
    for name, weight in models:
        c.execute(
            "INSERT OR IGNORE INTO ai_models(name, weight, accuracy, updated_at) VALUES(?,?,0.5,?)",
            (name, weight, datetime.utcnow().isoformat()),
        )

    conn.commit()
    conn.close()


# ────────────────────────── PREDICTIONS ──────────────────────────

def save_prediction(ptype, subtype, data_dict, prediction_dict, confidence):
    conn = get_conn()
    now = datetime.utcnow().isoformat()
    cursor = conn.execute(
        """INSERT INTO predictions(type,subtype,data,prediction,confidence,created_at)
           VALUES(?,?,?,?,?,?)""",
        (ptype, subtype, json.dumps(data_dict), json.dumps(prediction_dict), confidence, now),
    )
    conn.commit()
    pred_id = cursor.lastrowid
    conn.close()
    return pred_id


def get_predictions(ptype=None, limit=50):
    conn = get_conn()
    if ptype:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE type=? ORDER BY created_at DESC LIMIT ?",
            (ptype, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        try:
            item["data"] = json.loads(item["data"]) if item.get("data") else None
        except Exception:
            pass
        try:
            item["prediction"] = json.loads(item["prediction"]) if item.get("prediction") else None
        except Exception:
            pass
        result.append(item)
    return result


def get_predictions_paginated(ptype=None, page=1, per_page=50):
    conn = get_conn()
    offset = (page - 1) * per_page
    if ptype:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE type=? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (ptype, per_page, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) AS c FROM predictions WHERE type=?", (ptype,)).fetchone()["c"]
    else:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) AS c FROM predictions").fetchone()["c"]
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["data"] = json.loads(item["data"]) if item.get("data") else None
        item["prediction"] = json.loads(item["prediction"]) if item.get("prediction") else None
        result.append(item)
    return {"items": result, "total": total, "page": page, "per_page": per_page}


def get_pending_predictions(ptype=None):
    conn = get_conn()
    if ptype:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE status='pending' AND type=? ORDER BY created_at ASC",
            (ptype,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE status='pending' ORDER BY created_at ASC"
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["data"] = json.loads(item["data"]) if item.get("data") else None
        item["prediction"] = json.loads(item["prediction"]) if item.get("prediction") else None
        result.append(item)
    return result


def update_prediction_status(pred_id, status, score=None):
    conn = get_conn()
    if score is not None:
        conn.execute(
            "UPDATE predictions SET status=?, score=? WHERE id=?",
            (status, score, pred_id),
        )
    else:
        conn.execute("UPDATE predictions SET status=? WHERE id=?", (status, pred_id))
    conn.commit()
    conn.close()


# ────────────────────────── RESULTS ──────────────────────────────

def save_result(rtype, actual_result_dict, draw_date, source="auto"):
    conn = get_conn()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO results(type,actual_result,draw_date,source,created_at) VALUES(?,?,?,?,?)",
        (rtype, json.dumps(actual_result_dict), draw_date, source, now),
    )
    conn.commit()
    conn.close()


def get_latest_result(rtype):
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM results WHERE type=? ORDER BY draw_date DESC, id DESC LIMIT 1",
        (rtype,),
    ).fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    item["actual_result"] = json.loads(item["actual_result"])
    return item


def get_results(rtype=None, limit=30):
    conn = get_conn()
    if rtype:
        rows = conn.execute(
            "SELECT * FROM results WHERE type=? ORDER BY draw_date DESC LIMIT ?",
            (rtype, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM results ORDER BY draw_date DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["actual_result"] = json.loads(item["actual_result"]) if item.get("actual_result") else None
        result.append(item)
    return result


def get_results_paginated(rtype=None, page=1, per_page=30):
    conn = get_conn()
    offset = (page - 1) * per_page
    if rtype:
        rows = conn.execute(
            "SELECT * FROM results WHERE type=? ORDER BY draw_date DESC, id DESC LIMIT ? OFFSET ?",
            (rtype, per_page, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) AS c FROM results WHERE type=?", (rtype,)).fetchone()["c"]
    else:
        rows = conn.execute(
            "SELECT * FROM results ORDER BY draw_date DESC, id DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) AS c FROM results").fetchone()["c"]
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["actual_result"] = json.loads(item["actual_result"]) if item.get("actual_result") else None
        result.append(item)
    return {"items": result, "total": total, "page": page, "per_page": per_page}


def save_lottery_draw(lottery_type, draw_date, numbers, bonus=None, source="seed"):
    conn = get_conn()
    conn.execute(
        """INSERT INTO lottery_draws(lottery_type, draw_date, numbers, bonus, source, created_at)
           VALUES(?,?,?,?,?,?)""",
        (
            lottery_type,
            draw_date,
            json.dumps(numbers),
            bonus,
            source,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_lottery_draws(lottery_type=None, limit=100):
    conn = get_conn()
    if lottery_type:
        rows = conn.execute(
            "SELECT * FROM lottery_draws WHERE lottery_type=? ORDER BY draw_date DESC, id DESC LIMIT ?",
            (lottery_type, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM lottery_draws ORDER BY draw_date DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["numbers"] = json.loads(item["numbers"]) if item.get("numbers") else []
        result.append(item)
    return result


def get_latest_lottery_draws():
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT d1.*
        FROM lottery_draws d1
        INNER JOIN (
            SELECT lottery_type, MAX(draw_date) AS max_date
            FROM lottery_draws
            GROUP BY lottery_type
        ) d2 ON d1.lottery_type = d2.lottery_type AND d1.draw_date = d2.max_date
        ORDER BY d1.lottery_type
        """
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["numbers"] = json.loads(item["numbers"]) if item.get("numbers") else []
        result.append(item)
    return result


def save_sports_match(country, league, match_date, home_team, away_team, home_score=None, away_score=None, status="scheduled", source="seed"):
    conn = get_conn()
    conn.execute(
        """INSERT INTO sports_matches(country, league, match_date, home_team, away_team, home_score, away_score, status, source, created_at)
           VALUES(?,?,?,?,?,?,?,?,?,?)""",
        (
            country,
            league,
            match_date,
            home_team,
            away_team,
            home_score,
            away_score,
            status,
            source,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_sports_leagues():
    conn = get_conn()
    rows = conn.execute(
        "SELECT country, league, COUNT(*) AS total_matches FROM sports_matches GROUP BY country, league ORDER BY country, league"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_sports_matches(league=None, country=None, status=None, limit=100):
    conn = get_conn()
    query = "SELECT * FROM sports_matches WHERE 1=1"
    params = []
    if league:
        query += " AND league=?"
        params.append(league)
    if country:
        query += " AND country=?"
        params.append(country)
    if status:
        query += " AND status=?"
        params.append(status)
    query += " ORDER BY match_date DESC, id DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_sports_match_result(match_id, home_score, away_score, status="finished", source="simulated"):
    conn = get_conn()
    conn.execute(
        """
        UPDATE sports_matches
        SET home_score=?, away_score=?, status=?, source=?
        WHERE id=?
        """,
        (home_score, away_score, status, source, match_id),
    )
    conn.commit()
    conn.close()


def update_sync_state(domain, source, status, message=None):
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO sync_state(domain, last_sync_at, source, status, message)
        VALUES(?,?,?,?,?)
        ON CONFLICT(domain) DO UPDATE SET
            last_sync_at=excluded.last_sync_at,
            source=excluded.source,
            status=excluded.status,
            message=excluded.message
        """,
        (domain, datetime.utcnow().isoformat(), source, status, message),
    )
    conn.commit()
    conn.close()


def get_sync_state():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM sync_state ORDER BY domain").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_user(email, password_hash, role="user"):
    now = datetime.utcnow().isoformat()
    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO users(email,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?)",
        (email, password_hash, role, now, now),
    )
    user_id = cursor.lastrowid
    conn.execute(
        "INSERT INTO subscriptions(user_id,plan,status,started_at,expires_at) VALUES(?,?,?,?,?)",
        (user_id, "starter", "active", now, None),
    )
    conn.commit()
    conn.close()
    return user_id


def get_user_by_email(email):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def save_auth_token(user_id, token, expires_at):
    conn = get_conn()
    conn.execute(
        "INSERT INTO auth_tokens(user_id,token,created_at,expires_at) VALUES(?,?,?,?)",
        (user_id, token, datetime.utcnow().isoformat(), expires_at),
    )
    conn.commit()
    conn.close()


def get_user_by_token(token):
    conn = get_conn()
    row = conn.execute(
        """
        SELECT u.*
        FROM auth_tokens t
        JOIN users u ON u.id=t.user_id
        WHERE t.token=? AND t.expires_at >= ?
        ORDER BY t.id DESC LIMIT 1
        """,
        (token, datetime.utcnow().isoformat()),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def revoke_token(token):
    conn = get_conn()
    conn.execute("DELETE FROM auth_tokens WHERE token=?", (token,))
    conn.commit()
    conn.close()


def get_subscription(user_id):
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM subscriptions WHERE user_id=? ORDER BY id DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def upsert_subscription(user_id, plan, status="active", expires_at=None):
    conn = get_conn()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO subscriptions(user_id,plan,status,started_at,expires_at) VALUES(?,?,?,?,?)",
        (user_id, plan, status, now, expires_at),
    )
    conn.commit()
    conn.close()


def save_scheduler_log(job_name, status, details=None):
    conn = get_conn()
    conn.execute(
        "INSERT INTO scheduler_logs(job_name,run_at,status,details) VALUES(?,?,?,?)",
        (job_name, datetime.utcnow().isoformat(), status, details),
    )
    conn.commit()
    conn.close()


def get_scheduler_logs(limit=50):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM scheduler_logs ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ────────────────────────── AI MODELS ────────────────────────────

def get_model_weights():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM ai_models ORDER BY weight DESC").fetchall()
    conn.close()
    return {r["name"]: r["weight"] for r in rows}


def update_model_weight(name, was_correct: bool):
    conn = get_conn()
    row = conn.execute("SELECT * FROM ai_models WHERE name=?", (name,)).fetchone()
    if not row:
        conn.close()
        return
    total = row["total_runs"] + 1
    wins = row["wins"] + (1 if was_correct else 0)
    accuracy = wins / total
    # Réajustement dynamique : ±5 % par résultat, borné entre 0.2 et 2.0
    delta = 0.05 if was_correct else -0.05
    new_weight = max(0.2, min(2.0, row["weight"] + delta))
    conn.execute(
        """UPDATE ai_models SET weight=?,accuracy=?,total_runs=?,wins=?,updated_at=?
           WHERE name=?""",
        (new_weight, accuracy, total, wins, datetime.utcnow().isoformat(), name),
    )
    conn.commit()
    conn.close()


def get_model_stats():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM ai_models").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ────────────────────────── PERFORMANCE ──────────────────────────

def compute_performance():
    conn = get_conn()
    rows = conn.execute(
        "SELECT type, status, confidence FROM predictions"
    ).fetchall()
    conn.close()

    stats = {}
    for r in rows:
        t = r["type"]
        if t not in stats:
            stats[t] = {"total": 0, "won": 0, "pending": 0, "confidences": []}
        stats[t]["total"] += 1
        stats[t]["confidences"].append(r["confidence"])
        if r["status"] == "won":
            stats[t]["won"] += 1
        elif r["status"] == "pending":
            stats[t]["pending"] += 1

    result = {}
    for t, s in stats.items():
        closed = s["total"] - s["pending"]
        result[t] = {
            "total": s["total"],
            "won": s["won"],
            "pending": s["pending"],
            "accuracy": round(s["won"] / closed * 100, 1) if closed > 0 else 0,
            "avg_confidence": round(sum(s["confidences"]) / len(s["confidences"]), 1) if s["confidences"] else 0,
        }
    return result


def compute_performance_by_subtype():
    conn = get_conn()
    rows = conn.execute(
        "SELECT type, subtype, status, confidence, score FROM predictions"
    ).fetchall()
    conn.close()

    stats = {}
    for r in rows:
        group = f"{r['type']}:{r['subtype'] or 'global'}"
        if group not in stats:
            stats[group] = {
                "type": r["type"],
                "subtype": r["subtype"],
                "total": 0,
                "won": 0,
                "pending": 0,
                "confidences": [],
                "scores": [],
            }

        item = stats[group]
        item["total"] += 1
        item["confidences"].append(r["confidence"])
        if r["score"] is not None:
            item["scores"].append(r["score"])

        if r["status"] == "won":
            item["won"] += 1
        elif r["status"] == "pending":
            item["pending"] += 1

    result = []
    for _, s in stats.items():
        closed = s["total"] - s["pending"]
        result.append(
            {
                "type": s["type"],
                "subtype": s["subtype"],
                "total": s["total"],
                "pending": s["pending"],
                "won": s["won"],
                "accuracy": round(s["won"] / closed * 100, 1) if closed > 0 else 0,
                "avg_confidence": round(sum(s["confidences"]) / len(s["confidences"]), 1) if s["confidences"] else 0,
                "avg_score": round(sum(s["scores"]) / len(s["scores"]), 1) if s["scores"] else 0,
            }
        )

    result.sort(key=lambda x: (x["type"], x["subtype"] or ""))
    return result


# ────────────────────────── NOTIFICATIONS ────────────────────────

def push_notification(ntype, message):
    conn = get_conn()
    conn.execute(
        "INSERT INTO notifications(type,message,created_at) VALUES(?,?,?)",
        (ntype, message, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()


def get_notifications(unread_only=False, limit=20):
    conn = get_conn()
    if unread_only:
        rows = conn.execute(
            "SELECT * FROM notifications WHERE is_read=0 ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_notifications_read():
    conn = get_conn()
    conn.execute("UPDATE notifications SET is_read=1")
    conn.commit()
    conn.close()

"""
Adapteur Turso HTTP — compatible sqlite3 pour db.py
Utilisé quand TURSO_DB_URL et TURSO_AUTH_TOKEN sont définis.

Pas de dépendance externe : utilise uniquement urllib (stdlib Python).
"""

import json
import urllib.request
import urllib.error


class TursoRow:
    """Ligne compatible sqlite3.Row : accès par index ET par nom de colonne."""

    def __init__(self, cols, raw_values):
        self._cols = [c["name"] for c in cols]
        self._values = []
        for v in raw_values:
            val_type = v.get("type", "text")
            val = v.get("value")
            if val is None or val_type == "null":
                self._values.append(None)
            elif val_type == "integer":
                self._values.append(int(val))
            elif val_type == "float":
                self._values.append(float(val))
            else:
                self._values.append(val)
        self._dict = dict(zip(self._cols, self._values))

    # Accès par index ou par nom
    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._dict[key]

    def __iter__(self):
        return iter(self._values)

    def get(self, key, default=None):
        return self._dict.get(key, default)

    def keys(self):
        return list(self._cols)

    # Pour dict(row) — Python appelle keys() puis []
    def __len__(self):
        return len(self._cols)


class TursoCursor:
    """Curseur compatible sqlite3.Cursor."""

    def __init__(self, result_obj=None):
        self._rows = []
        self._idx = 0
        self.lastrowid = None
        if result_obj is None:
            return
        cols = result_obj.get("cols", [])
        self._rows = [TursoRow(cols, row) for row in result_obj.get("rows", [])]
        lid = result_obj.get("last_insert_rowid")
        try:
            self.lastrowid = int(lid) if lid is not None else None
        except (TypeError, ValueError):
            self.lastrowid = None

    def fetchall(self):
        return self._rows

    def fetchone(self):
        if self._idx < len(self._rows):
            row = self._rows[self._idx]
            self._idx += 1
            return row
        return None

    def __iter__(self):
        return iter(self._rows)


class TursoConnection:
    """
    Connexion à Turso via l'API HTTP HRANA v3.
    Compatible avec l'API sqlite3 utilisée dans db.py.
    """

    def __init__(self, db_url: str, auth_token: str):
        # Normalise libsql:// → https://
        url = db_url.strip()
        if url.startswith("libsql://"):
            url = "https://" + url[len("libsql://"):]
        self._pipeline_url = url.rstrip("/") + "/v2/pipeline"
        self._token = auth_token

    # ── Conversion des paramètres Python → format Turso ──────────
    @staticmethod
    def _to_arg(value):
        if value is None:
            return {"type": "null"}
        if isinstance(value, bool):
            return {"type": "integer", "value": str(int(value))}
        if isinstance(value, int):
            return {"type": "integer", "value": str(value)}
        if isinstance(value, float):
            return {"type": "float", "value": str(value)}
        return {"type": "text", "value": str(value)}

    # ── Envoi HTTP ────────────────────────────────────────────────
    def _http_pipeline(self, statements):
        """
        statements : liste de (sql_str, params_tuple)
        Retourne la liste brute results[] de Turso.
        """
        requests = [
            {
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": [self._to_arg(p) for p in (params or ())],
                },
            }
            for sql, params in statements
        ]
        requests.append({"type": "close"})

        body = json.dumps({"requests": requests}).encode("utf-8")
        req = urllib.request.Request(
            self._pipeline_url,
            data=body,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode("utf-8"))["results"]
        except urllib.error.HTTPError as exc:
            body_err = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Turso HTTP {exc.code}: {body_err[:300]}") from exc

    # ── API publique (compatible sqlite3) ─────────────────────────
    def execute(self, sql, params=()):
        results = self._http_pipeline([(sql, params)])
        res = results[0]
        if res["type"] == "error":
            raise RuntimeError(
                f"Turso error: {res.get('error', {}).get('message', 'unknown')}"
            )
        return TursoCursor(res["response"]["result"])

    def executemany(self, sql, seq_of_params):
        last = TursoCursor()
        for params in seq_of_params:
            last = self.execute(sql, params)
        return last

    def batch_execute(self, statements):
        """
        Envoie TOUTES les instructions en UN seul appel HTTP.
        statements : liste de (sql, params) ou juste sql (tuple/str).
        Retourne la liste des TursoCursor.
        """
        normalized = []
        for s in statements:
            if isinstance(s, str):
                normalized.append((s, ()))
            else:
                normalized.append(s)
        results = self._http_pipeline(normalized)
        cursors = []
        for res in results:
            if res["type"] == "close":
                break
            if res["type"] == "error":
                cursors.append(TursoCursor())
            else:
                cursors.append(TursoCursor(res["response"]["result"]))
        return cursors

    def cursor(self):
        """Retourne un proxy cursor qui délègue à execute()."""
        return _CursorProxy(self)

    def commit(self):
        pass  # Turso auto-commit par défaut

    def close(self):
        pass  # Connexion stateless, rien à fermer


class _CursorProxy:
    """Proxy cursor : délègue toutes les opérations à TursoConnection."""

    def __init__(self, conn: TursoConnection):
        self._conn = conn
        self._current = TursoCursor()

    def execute(self, sql, params=()):
        self._current = self._conn.execute(sql, params)
        return self

    def fetchall(self):
        return self._current.fetchall()

    def fetchone(self):
        return self._current.fetchone()

    @property
    def lastrowid(self):
        return self._current.lastrowid

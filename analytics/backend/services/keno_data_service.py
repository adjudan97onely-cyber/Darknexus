"""
Keno Data Service - Données officielles FDJ
Télécharge, parse et stocke l'historique des tirages Keno.
"""

import urllib.request
import zipfile
import io
import csv
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────

KENO_NUMBERS_COUNT = 20   # FDJ Keno : exactement 20 boules tirées sur 70
KENO_POOL_SIZE     = 70

# URLs vérifiées et fonctionnelles (cdn-media.fdj.fr)
# keno_201811 : Nov 2018 → Oct 2020 (1414 tirages)
# keno_202010 : Oct 2020 → Juil 2024 (2751 tirages)
FDJ_CSV_URLS = [
    "https://cdn-media.fdj.fr/static-draws/csv/keno/keno_201811.zip",
    "https://cdn-media.fdj.fr/static-draws/csv/keno/keno_202010.zip",
]

DB_PATH = Path(__file__).parent.parent.parent / "databases" / "keno_draws.json"


# ── Stockage local ─────────────────────────────────────────────────────────────

def _load_db() -> Dict:
    if DB_PATH.exists():
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"draws": [], "last_updated": None}


def _save_db(data: Dict):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, default=str)


def get_stored_draws() -> List[Dict]:
    return _load_db().get("draws", [])


# ── Téléchargement et parsing FDJ ──────────────────────────────────────────────

def _parse_fdj_csv(content: str) -> List[Dict]:
    """
    Parse un CSV FDJ Keno.
    Format réel FDJ (vérifié) :
      annee_numero_de_tirage;date_de_tirage;heure_de_tirage;date_de_forclusion;
      boule1;boule2;...;boule20;multiplicateur;numero_jokerplus;devise;
    Séparateur : point-virgule
    Encodage : latin-1
    Retourne uniquement les tirages avec exactement 20 numéros valides (1–70).
    """
    draws = []
    reader = csv.DictReader(io.StringIO(content), delimiter=";")

    for row in reader:
        try:
            numbers = []
            # Colonnes boule1 à boule20 (sans underscore)
            for i in range(1, 21):
                key = f"boule{i}"
                val = row.get(key, "").strip()
                if not val:
                    break
                n = int(val)
                if not (1 <= n <= KENO_POOL_SIZE):
                    raise ValueError(f"Numéro hors plage: {n}")
                numbers.append(n)

            # Validation stricte
            if len(numbers) != KENO_NUMBERS_COUNT:
                logger.debug(f"Tirage ignoré ({len(numbers)} numéros): {dict(list(row.items())[:5])}")
                continue
            if len(set(numbers)) != KENO_NUMBERS_COUNT:
                logger.debug(f"Tirage ignoré (doublons): {numbers}")
                continue

            # Date au format DD/MM/YYYY
            raw_date = row.get("date_de_tirage", "").strip()
            try:
                draw_date = datetime.strptime(raw_date, "%d/%m/%Y").date().isoformat()
            except ValueError:
                draw_date = raw_date

            draws.append({
                "date": draw_date,
                "numbers": sorted(numbers),
            })

        except (ValueError, KeyError) as e:
            logger.debug(f"Ligne ignorée ({e})")
            continue

    return draws


def download_fdj_draws() -> List[Dict]:
    """
    Télécharge tous les fichiers ZIP FDJ et retourne les tirages parsés.
    """
    all_draws = []

    for url in FDJ_CSV_URLS:
        try:
            logger.info(f"Telechargement : {url}")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                content_bytes = resp.read()

            with zipfile.ZipFile(io.BytesIO(content_bytes)) as zf:
                for name in zf.namelist():
                    if name.lower().endswith(".csv"):
                        csv_bytes = zf.read(name)
                        # FDJ utilise latin-1
                        content = csv_bytes.decode("latin-1", errors="replace")
                        draws = _parse_fdj_csv(content)
                        logger.info(f"  ✅ {name} → {len(draws)} tirages valides")
                        all_draws.extend(draws)

        except urllib.error.URLError as e:
            logger.error(f"Erreur telechargement {url}: {e}")
        except zipfile.BadZipFile as e:
            logger.error(f"❌ ZIP invalide {url}: {e}")

    # Déduplique et trie par date
    seen = set()
    unique = []
    for d in all_draws:
        key = (d["date"], tuple(d["numbers"]))
        if key not in seen:
            seen.add(key)
            unique.append(d)

    unique.sort(key=lambda x: x["date"])
    logger.info(f"📊 Total tirages uniques: {len(unique)}")
    return unique


def refresh_draws() -> Dict:
    """
    Met à jour la base locale depuis FDJ.
    Retourne un résumé de l'opération.
    """
    draws = download_fdj_draws()

    if not draws:
        return {"success": False, "message": "Aucun tirage téléchargé", "count": 0}

    db = {"draws": draws, "last_updated": datetime.now().isoformat()}
    _save_db(db)

    return {
        "success": True,
        "count": len(draws),
        "oldest": draws[0]["date"],
        "newest": draws[-1]["date"],
        "last_updated": db["last_updated"],
    }

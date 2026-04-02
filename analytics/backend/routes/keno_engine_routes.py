"""
Keno Engine Routes - API statistique Keno
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional
import logging

from services.keno_data_service import (
    get_stored_draws,
    refresh_draws,
    KENO_NUMBERS_COUNT,
)
from services.keno_engine import compute_scores, generate_grids, backtest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/keno", tags=["Keno Engine"])


def _get_draws_or_raise(min_count: int = 20):
    draws = get_stored_draws()
    numbers_only = [d["numbers"] for d in draws if len(d.get("numbers", [])) == KENO_NUMBERS_COUNT]
    if len(numbers_only) < min_count:
        raise HTTPException(
            status_code=503,
            detail=f"Données insuffisantes : {len(numbers_only)} tirages. Appelez POST /api/keno/refresh d'abord."
        )
    return numbers_only


# ── Données ────────────────────────────────────────────────────────────────────

@router.get("/draws")
def get_draws(limit: int = Query(100, ge=1, le=5000)):
    """Retourne les derniers tirages stockés."""
    draws = get_stored_draws()
    return {
        "count":  len(draws),
        "data":   draws[-limit:],
        "valid":  all(len(d.get("numbers", [])) == KENO_NUMBERS_COUNT for d in draws),
    }


@router.post("/refresh")
def trigger_refresh(background_tasks: BackgroundTasks):
    """Lance le téléchargement des données FDJ en arrière-plan."""
    def _run():
        result = refresh_draws()
        logger.info(f"Refresh terminé: {result}")

    background_tasks.add_task(_run)
    return {"message": "Mise à jour lancée en arrière-plan. Revenez dans 30 secondes."}


@router.post("/refresh/sync")
def trigger_refresh_sync():
    """Télécharge les données FDJ de manière synchrone (peut prendre 30s)."""
    result = refresh_draws()
    if not result["success"]:
        raise HTTPException(status_code=503, detail=result["message"])
    return result


# ── Analyse ────────────────────────────────────────────────────────────────────

@router.get("/analysis")
def get_analysis():
    """
    Retourne le score composite de chaque numéro (1–70).

    Score = 0.25·F_court + 0.35·F_moyen + 0.20·F_long + 0.15·Retard + 0.05·Stabilité

    DISCLAIMER : Le Keno est un jeu de hasard. Ces scores ne prédisent rien.
    """
    draws = _get_draws_or_raise(20)
    scores = compute_scores(draws)

    hot    = sorted([n for n, s in scores.items() if s["status"] == "hot"],    key=lambda n: -scores[n]["score"])
    cold   = sorted([n for n, s in scores.items() if s["status"] == "cold"],   key=lambda n: -scores[n]["delay"])
    top10  = sorted(scores.keys(), key=lambda n: -scores[n]["score"])[:10]

    return {
        "disclaimer": "Le Keno est un jeu aléatoire. Ces statistiques sont informatives.",
        "total_draws": len(draws),
        "scores":  scores,
        "hot":     hot,
        "cold":    cold,
        "top10":   top10,
        "weights": {
            "freq_short_20":   "25%",
            "freq_medium_100": "35%",
            "freq_long_500":   "20%",
            "delay_score":     "15%",
            "stability":       "5%",
        },
    }


# ── Génération de grilles ──────────────────────────────────────────────────────

@router.get("/generate-grid")
def generate_grid_endpoint(
    grid_size: int = Query(10, ge=2, le=20),
    n_grids:   int = Query(3,  ge=1, le=10),
):
    """
    Génère des grilles statistiques en 3 stratégies.

    - conservative : numéros les plus fréquents
    - balanced     : mix fréquence + retard
    - aggressive   : numéros en retard (surreprésentés dans le futur selon la théorie)
    """
    draws  = _get_draws_or_raise(50)
    scores = compute_scores(draws)
    grids  = generate_grids(scores, grid_size=grid_size, n_grids=n_grids)

    return {
        "disclaimer": "Le Keno est un jeu de hasard. Ces grilles n'augmentent pas vos chances de gain.",
        "grid_size":  grid_size,
        "draws_used": len(draws),
        "grids":      grids,
    }


# ── Backtesting ────────────────────────────────────────────────────────────────

@router.get("/backtest")
def run_backtest(
    grid_size: int = Query(10, ge=2, le=20),
    test_size: int = Query(500, ge=50, le=2000),
):
    """
    Backtesting du modèle sur les derniers tirages.
    Compare les hits du modèle vs grilles aléatoires.
    """
    draws = _get_draws_or_raise(100)
    result = backtest(draws, grid_size=grid_size, test_size=test_size)
    return result


# ── Heatmap ────────────────────────────────────────────────────────────────────

@router.get("/heatmap")
def get_heatmap(window: int = Query(100, ge=20, le=2000)):
    """
    Données pour heatmap : fréquence de chaque numéro sur les `window` derniers tirages.
    Format prêt pour recharts / d3.
    """
    draws = _get_draws_or_raise(20)
    subset = draws[-window:]

    from collections import Counter
    all_numbers = [n for draw in subset for n in draw]
    counts = Counter(all_numbers)
    expected = len(subset) * KENO_NUMBERS_COUNT / 70

    heatmap = []
    for n in range(1, 71):
        freq = counts.get(n, 0)
        heatmap.append({
            "number":    n,
            "count":     freq,
            "frequency": round(freq / len(subset), 4),
            "expected":  round(expected / len(subset), 4),
            "deviation": round((freq - expected) / (expected ** 0.5), 2) if expected > 0 else 0,
            "row":       (n - 1) // 10,
            "col":       (n - 1) % 10,
        })

    return {"window": window, "draws": len(subset), "data": heatmap}


# ── Debug ──────────────────────────────────────────────────────────────────────

@router.get("/debug/draw-integrity")
def debug_draw_integrity():
    """
    Vérifie l'intégrité de tous les tirages stockés.
    Identifie les tirages avec un mauvais nombre de numéros.
    """
    draws = get_stored_draws()
    issues = []
    counts = {}

    for i, d in enumerate(draws):
        n = len(d.get("numbers", []))
        counts[n] = counts.get(n, 0) + 1
        if n != KENO_NUMBERS_COUNT:
            issues.append({"index": i, "date": d.get("date"), "count": n, "numbers": d.get("numbers")})

    return {
        "total":             len(draws),
        "valid":             counts.get(KENO_NUMBERS_COUNT, 0),
        "invalid":           len(issues),
        "count_distribution": counts,
        "issues_sample":     issues[:10],
        "expected_per_draw": KENO_NUMBERS_COUNT,
    }

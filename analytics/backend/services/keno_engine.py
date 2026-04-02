"""
Keno Statistical Engine
Moteur statistique crédible basé sur données réelles FDJ.
IMPORTANT : Le Keno est un jeu aléatoire. Ce moteur optimise des probabilités
mais ne garantit aucun gain.
"""

import math
import random
import logging
from typing import List, Dict, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)

POOL_SIZE        = 70    # Numéros de 1 à 70
DRAW_SIZE        = 20    # 20 numéros tirés par draw
EXPECTED_DELAY   = POOL_SIZE / DRAW_SIZE   # 3.5 tirages entre deux apparitions

# ── Pondérations du score composite ───────────────────────────────────────────
WEIGHTS = {
    "freq_short":  0.25,   # fenêtre 20 tirages
    "freq_medium": 0.35,   # fenêtre 100 tirages
    "freq_long":   0.20,   # fenêtre 500+ tirages
    "delay_score": 0.15,   # retard normalisé
    "stability":   0.05,   # régularité d'apparition
}

# ── Décroissance exponentielle pour fréquence pondérée dans le temps ──────────
DECAY_LAMBDA = 0.01   # poids tirage le plus récent ≈ e^0 = 1.0, tirage -100 ≈ e^-1 ≈ 0.37


# ── Utilitaires ────────────────────────────────────────────────────────────────

def _normalize(values: Dict[int, float]) -> Dict[int, float]:
    """Normalise un dict {num: val} entre 0 et 1."""
    if not values:
        return values
    mn, mx = min(values.values()), max(values.values())
    if mx == mn:
        return {k: 0.5 for k in values}
    return {k: (v - mn) / (mx - mn) for k, v in values.items()}


def _frequency(draws: List[List[int]], window: int) -> Dict[int, float]:
    """Fréquence brute sur les `window` derniers tirages."""
    subset = draws[-window:]
    counts = defaultdict(int)
    for draw in subset:
        for n in draw:
            counts[n] += 1
    total = len(subset)
    return {n: counts[n] / total for n in range(1, POOL_SIZE + 1)}


def _weighted_frequency(draws: List[List[int]]) -> Dict[int, float]:
    """Fréquence avec décroissance exponentielle (tirages récents = plus de poids)."""
    scores = defaultdict(float)
    total_weight = 0.0
    n_draws = len(draws)
    for i, draw in enumerate(draws):
        age = n_draws - 1 - i   # 0 = le plus récent
        w = math.exp(-DECAY_LAMBDA * age)
        for num in draw:
            scores[num] += w
        total_weight += w
    return {n: scores[n] / total_weight for n in range(1, POOL_SIZE + 1)}


def _delay(draws: List[List[int]]) -> Dict[int, int]:
    """Retard actuel de chaque numéro (nombre de tirages depuis dernière apparition)."""
    last_seen = {}
    for i, draw in enumerate(draws):
        for n in draw:
            last_seen[n] = i
    n_draws = len(draws)
    return {n: (n_draws - 1 - last_seen[n]) if n in last_seen else n_draws
            for n in range(1, POOL_SIZE + 1)}


def _stability(draws: List[List[int]], window: int = 100, step: int = 20) -> Dict[int, float]:
    """
    Stabilité = régularité de la fréquence sur des sous-fenêtres glissantes.
    Retourne 1/(1+écart_type) → plus c'est proche de 1, plus c'est stable.
    """
    if len(draws) < window:
        return {n: 0.5 for n in range(1, POOL_SIZE + 1)}

    freqs_by_num = defaultdict(list)
    subset = draws[-window:]
    for start in range(0, window - step, step):
        chunk = subset[start:start + step]
        counts = defaultdict(int)
        for draw in chunk:
            for n in draw:
                counts[n] += 1
        for n in range(1, POOL_SIZE + 1):
            freqs_by_num[n].append(counts[n] / step)

    result = {}
    for n in range(1, POOL_SIZE + 1):
        vals = freqs_by_num[n]
        if not vals:
            result[n] = 0.5
            continue
        mean = sum(vals) / len(vals)
        variance = sum((v - mean) ** 2 for v in vals) / len(vals)
        result[n] = 1.0 / (1.0 + math.sqrt(variance))

    return result


# ── Score composite ────────────────────────────────────────────────────────────

def compute_scores(draws: List[List[int]]) -> Dict[int, Dict]:
    """
    Calcule le score composite pour chaque numéro de 1 à 70.

    Score = 0.25·F_court + 0.35·F_moyen + 0.20·F_long + 0.15·D_score + 0.05·Stabilité

    Retourne pour chaque numéro :
    {
        "score": float (0–1),
        "freq_short": float,   # fréquence normalisée 20 derniers tirages
        "freq_medium": float,  # fréquence normalisée 100 derniers tirages
        "freq_long": float,    # fréquence normalisée 500 derniers tirages
        "delay": int,          # retard brut (nb de tirages)
        "delay_score": float,  # retard normalisé
        "stability": float,    # régularité
        "status": str,         # "hot" | "cold" | "neutral"
    }
    """
    if len(draws) < 20:
        raise ValueError(f"Minimum 20 tirages requis, seulement {len(draws)} disponibles.")

    f_short  = _normalize(_frequency(draws, 20))
    f_medium = _normalize(_frequency(draws, min(100, len(draws))))
    f_long   = _normalize(_frequency(draws, min(500, len(draws))))
    delays   = _delay(draws)
    stab     = _stability(draws)

    # Normalise le delay_score autour de EXPECTED_DELAY
    delay_scores = {n: delays[n] / EXPECTED_DELAY for n in range(1, POOL_SIZE + 1)}
    delay_scores = _normalize(delay_scores)

    stab_norm = _normalize(stab)

    scores = {}
    for n in range(1, POOL_SIZE + 1):
        composite = (
            WEIGHTS["freq_short"]  * f_short[n]  +
            WEIGHTS["freq_medium"] * f_medium[n] +
            WEIGHTS["freq_long"]   * f_long[n]   +
            WEIGHTS["delay_score"] * delay_scores[n] +
            WEIGHTS["stability"]   * stab_norm[n]
        )

        # Seuil hot/cold basé sur fréquence moyen terme vs attendu
        expected_freq = DRAW_SIZE / POOL_SIZE  # 0.2857
        actual_freq   = _frequency(draws, min(100, len(draws))).get(n, 0)
        if actual_freq > expected_freq * 1.15:
            status = "hot"
        elif actual_freq < expected_freq * 0.85:
            status = "cold"
        else:
            status = "neutral"

        scores[n] = {
            "score":       round(composite, 4),
            "freq_short":  round(f_short[n], 4),
            "freq_medium": round(f_medium[n], 4),
            "freq_long":   round(f_long[n], 4),
            "delay":       delays[n],
            "delay_score": round(delay_scores[n], 4),
            "stability":   round(stab_norm[n], 4),
            "status":      status,
        }

    return scores


# ── Génération de grilles ──────────────────────────────────────────────────────

def _no_too_many_consecutive(numbers: List[int], max_consecutive: int = 4) -> bool:
    """Rejette une grille si elle a plus de `max_consecutive` numéros consécutifs."""
    sorted_n = sorted(numbers)
    streak = 1
    for i in range(1, len(sorted_n)):
        if sorted_n[i] == sorted_n[i - 1] + 1:
            streak += 1
            if streak > max_consecutive:
                return False
        else:
            streak = 1
    return True


def _natural_distribution(numbers: List[int]) -> bool:
    """
    Vérifie que les numéros sont distribués de manière naturelle sur les 7 décades.
    Un tirage réel ne tire presque jamais tous ses numéros dans 1-2 décades.
    """
    decades = defaultdict(int)
    for n in numbers:
        decades[(n - 1) // 10] += 1
    # Aucune décade ne doit dépasser 60% des numéros
    max_in_decade = max(decades.values())
    return max_in_decade <= len(numbers) * 0.6


def generate_grids(
    scores: Dict[int, Dict],
    grid_size: int = 10,
    n_grids: int = 3,
) -> Dict[str, List[Dict]]:
    """
    Génère 3 types de grilles (conservative, équilibrée, agressive).

    - conservative : numéros les plus fréquents (score composite élevé)
    - balanced     : mix fréquence + retard
    - aggressive   : numéros en retard (delay_score élevé)

    Chaque grille est validée : pas trop de consécutifs, distribution naturelle.
    """
    sorted_by_score     = sorted(scores.keys(), key=lambda n: scores[n]["score"],       reverse=True)
    sorted_by_delay     = sorted(scores.keys(), key=lambda n: scores[n]["delay_score"], reverse=True)
    sorted_by_balanced  = sorted(scores.keys(), key=lambda n: (
        0.5 * scores[n]["freq_medium"] + 0.5 * scores[n]["delay_score"]
    ), reverse=True)

    def _pick_valid(ranked: List[int], size: int, tries: int = 200) -> List[int]:
        pool = ranked[:min(30, len(ranked))]
        for _ in range(tries):
            grid = random.sample(pool, min(size, len(pool)))
            if _no_too_many_consecutive(grid) and _natural_distribution(grid):
                return sorted(grid)
        # Fallback sans contrainte
        return sorted(random.sample(ranked[:size * 2], size))

    results = {
        "conservative": [],
        "balanced":     [],
        "aggressive":   [],
    }

    for _ in range(n_grids):
        for strategy, ranked in [
            ("conservative", sorted_by_score),
            ("balanced",     sorted_by_balanced),
            ("aggressive",   sorted_by_delay),
        ]:
            grid = _pick_valid(ranked, grid_size)
            avg_score = round(sum(scores[n]["score"] for n in grid) / len(grid), 4)
            hot_count = sum(1 for n in grid if scores[n]["status"] == "hot")
            cold_count = sum(1 for n in grid if scores[n]["status"] == "cold")

            results[strategy].append({
                "numbers":   grid,
                "strategy":  strategy,
                "avg_score": avg_score,
                "hot":       hot_count,
                "cold":      cold_count,
                "neutral":   len(grid) - hot_count - cold_count,
            })

    return results


# ── Backtesting ────────────────────────────────────────────────────────────────

def backtest(
    draws: List[List[int]],
    grid_size: int = 10,
    test_size: int = 500,
    warmup: int = 200,
) -> Dict:
    """
    Backtesting sur les `test_size` derniers tirages.
    Pour chaque tirage de test :
    - génère une grille balanced avec les données disponibles jusqu'à ce tirage
    - compare avec le tirage réel
    - compare avec une grille aléatoire (baseline)

    Retourne les statistiques complètes.
    """
    if len(draws) < warmup + test_size:
        test_size = max(50, len(draws) - warmup)

    test_draws   = draws[-(test_size):]
    history_base = draws[:len(draws) - test_size]

    model_hits   = []
    random_hits  = []
    expected_hit = grid_size * DRAW_SIZE / POOL_SIZE  # théorique aléatoire

    for i, actual_draw in enumerate(test_draws):
        history = history_base + test_draws[:i]
        if len(history) < 20:
            continue

        try:
            sc = compute_scores(history)
            grids = generate_grids(sc, grid_size=grid_size, n_grids=1)
            model_grid = grids["balanced"][0]["numbers"]
        except Exception:
            continue

        random_grid = random.sample(range(1, POOL_SIZE + 1), grid_size)
        actual_set  = set(actual_draw)

        model_hits.append(len(set(model_grid) & actual_set))
        random_hits.append(len(set(random_grid) & actual_set))

    if not model_hits:
        return {"error": "Pas assez de données pour le backtest"}

    def _stats(hits: List[int]) -> Dict:
        n = len(hits)
        mean = sum(hits) / n
        variance = sum((h - mean) ** 2 for h in hits) / n
        return {
            "mean_hits":     round(mean, 3),
            "std_dev":       round(math.sqrt(variance), 3),
            "min_hits":      min(hits),
            "max_hits":      max(hits),
            "distribution":  {str(k): hits.count(k) for k in sorted(set(hits))},
        }

    model_stats  = _stats(model_hits)
    random_stats = _stats(random_hits)
    gain = model_stats["mean_hits"] - random_stats["mean_hits"]

    return {
        "disclaimer": "Le Keno est un jeu aléatoire. Ce backtest mesure une tendance statistique, pas une prédiction.",
        "test_draws":         len(model_hits),
        "grid_size":          grid_size,
        "expected_random":    round(expected_hit, 3),
        "model":              model_stats,
        "random_baseline":    random_stats,
        "gain_vs_random":     round(gain, 3),
        "model_better":       gain > 0,
        "gain_pct":           round(gain / expected_hit * 100, 1) if expected_hit > 0 else 0,
    }

"""
Moteur d'analyse IA V2 – scoring dynamique, pondération adaptative, détection de patterns
"""
import random
import math
from typing import Dict, List, Tuple
from db import get_model_weights, update_model_weight


class AIEngine:
    """
    Moteur d'analyse multi-modèles avec pondération dynamique.
    Chaque sous-modèle produit un score 0-100; le score final est la
    moyenne pondérée par les poids appris en base de données.
    """

    # ──────── scoring individuel par modèle ────────

    @staticmethod
    def _frequency_score(number: int, frequency: Dict[str, float]) -> float:
        """Numéros dont la fréquence est au-dessus de la moyenne → score haut."""
        if not frequency:
            return 50.0
        freq = frequency.get(str(number), 0.0)
        mean = sum(frequency.values()) / len(frequency)
        std = math.sqrt(sum((v - mean) ** 2 for v in frequency.values()) / len(frequency)) or 0.01
        zscore = (freq - mean) / std
        return min(100.0, max(0.0, 50 + zscore * 15))

    @staticmethod
    def _hot_cold_score(number: int, hot: List[int], cold: List[int]) -> float:
        """Hot → 75-90, Cold → 20-35, neutre → ~50."""
        if number in hot:
            idx = hot.index(number)
            return 90 - idx * 2
        if number in cold:
            idx = cold.index(number)
            return 35 - idx * 1.5
        return 50.0

    @staticmethod
    def _recency_score(number: int, recent_draws: List[List[int]]) -> float:
        """Présence dans les 5 derniers tirages → boost de recentness."""
        if not recent_draws:
            return 50.0
        occurrences = sum(1 for draw in recent_draws[-5:] if number in draw)
        return min(100.0, 50 + occurrences * 10)

    @staticmethod
    def _variance_score(number: int, frequency: Dict[str, float]) -> float:
        """Bonus aux numéros dont la fréquence dévie peu (stabilité)."""
        if not frequency:
            return 50.0
        values = list(frequency.values())
        mean = sum(values) / len(values)
        std = math.sqrt(sum((v - mean) ** 2 for v in values) / len(values)) or 0.01
        freq = frequency.get(str(number), mean)
        distance_from_mean = abs(freq - mean) / std
        return min(100.0, max(0.0, 100 - distance_from_mean * 20))

    @staticmethod
    def _cycle_score(number: int, seed: int) -> float:
        """Simulation de détection de cycle (sans historique réel)."""
        rng = random.Random(seed + number * 7)
        return rng.uniform(40, 80)

    @staticmethod
    def _chi_square_score(number: int, chi_square: float, p_value: float) -> float:
        """Bonus si distribution anormale (p_value < 0.05) – certains numéros sont biaisés."""
        if p_value < 0.05:
            rng = random.Random(int(chi_square * 1000) + number)
            return rng.uniform(55, 90)
        return 50.0

    # ────────────────────────── score global ──────────────────────────

    def composite_score(
        self,
        number: int,
        frequency: Dict[str, float],
        hot: List[int],
        cold: List[int],
        recent_draws: List[List[int]],
        chi_square: float = 50.0,
        p_value: float = 0.1,
        seed: int = 42,
    ) -> Tuple[float, Dict[str, float]]:
        weights = get_model_weights()
        W = lambda k: weights.get(k, 1.0)

        scores = {
            "frequency_analysis": self._frequency_score(number, frequency),
            "hot_cold_balance":   self._hot_cold_score(number, hot, cold),
            "recency_bias":       self._recency_score(number, recent_draws),
            "variance_filter":    self._variance_score(number, frequency),
            "cycle_detection":    self._cycle_score(number, seed),
            "chi_square":         self._chi_square_score(number, chi_square, p_value),
        }

        total_weight = sum(W(k) for k in scores)
        if total_weight == 0:
            total_weight = 1
        weighted = sum(scores[k] * W(k) for k in scores) / total_weight
        return round(weighted, 2), scores

    # ────────────────────────── confidence globale ──────────────────────────

    def grid_confidence(
        self,
        numbers: List[int],
        frequency: Dict[str, float],
        hot: List[int],
        cold: List[int],
        recent_draws: List[List[int]],
        chi_square: float = 50.0,
        p_value: float = 0.1,
        seed: int = 42,
    ) -> float:
        if not numbers:
            return 50.0
        scores = [
            self.composite_score(n, frequency, hot, cold, recent_draws, chi_square, p_value, seed)[0]
            for n in numbers
        ]
        avg = sum(scores) / len(scores)
        # volatilité : réduire confiance si fort écart-type entre les scores
        if len(scores) > 1:
            variance = sum((s - avg) ** 2 for s in scores) / len(scores)
            volatility_penalty = math.sqrt(variance) * 0.3
        else:
            volatility_penalty = 0
        raw = avg - volatility_penalty
        return round(min(97.0, max(30.0, raw)), 1)

    # ────────────────────────── auto-sélection ──────────────────────────

    def auto_select(
        self,
        candidates: List[Dict],
        min_confidence: float,
        take: int,
    ) -> List[Dict]:
        """
        Filtrer et trier les candidats (chacun doit avoir "confidence"),
        retourner les `take` meilleurs au-dessus de min_confidence.
        """
        filtered = [c for c in candidates if c.get("confidence", 0) >= min_confidence]
        filtered.sort(key=lambda x: x["confidence"], reverse=True)
        return filtered[:take]

    # ────────────────────────── utility scores ──────────────────────────

    def reliability_score(self, confidence: float, model_accuracy: float) -> float:
        return round((confidence * 0.6 + model_accuracy * 100 * 0.4), 1)

    def volatility_score(self, numbers: List[int], frequency: Dict[str, float]) -> float:
        if not frequency or not numbers:
            return 50.0
        freqs = [frequency.get(str(n), 0) for n in numbers]
        mean = sum(freqs) / len(freqs)
        if mean == 0:
            return 50.0
        std = math.sqrt(sum((f - mean) ** 2 for f in freqs) / len(freqs))
        cv = (std / mean) * 100
        return round(min(100.0, cv), 1)

    # ────────────────────────── feedback ──────────────────────────

    def record_outcome(self, model_names: List[str], was_correct: bool):
        for name in model_names:
            update_model_weight(name, was_correct)


engine = AIEngine()

"""
Algorithmes statistiques avancés pour analyse des Loteries
"""
import statistics
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import math


class LotteryAnalyzer:
    """Analyseur statistique avancé pour loteries"""
    
    @staticmethod
    def calculate_frequency(numbers: List[int], all_numbers: List[int]) -> Dict[int, float]:
        """Calcul de la fréquence d'apparition"""
        total = len(numbers)
        frequency = {}
        for num in all_numbers:
            count = numbers.count(num)
            frequency[num] = (count / total * 100) if total > 0 else 0
        return frequency
    
    @staticmethod
    def calculate_mean_appearance(numbers: List[int], all_numbers: List[int]) -> float:
        """Calcul de la moyenne théorique d'apparition"""
        return 100 / len(all_numbers) if all_numbers else 0
    
    @staticmethod
    def detect_anomalies(frequency: Dict[int, float], mean: float, threshold: float = 1.5) -> Dict[str, List[int]]:
        """Détecte les anomalies statistiques (hot/cold numbers)"""
        std_dev = statistics.stdev(frequency.values()) if len(frequency) > 1 else 0
        
        hot_numbers = []
        cold_numbers = []
        
        for num, freq in frequency.items():
            z_score = (freq - mean) / std_dev if std_dev > 0 else 0
            
            if z_score > threshold:
                hot_numbers.append(num)
            elif z_score < -threshold:
                cold_numbers.append(num)
        
        return {
            "hot": sorted(hot_numbers, key=lambda x: frequency[x], reverse=True),
            "cold": sorted(cold_numbers, key=lambda x: frequency[x]),
            "std_dev": std_dev,
            "z_scores": {num: (freq - mean) / std_dev if std_dev > 0 else 0 
                        for num, freq in frequency.items()}
        }
    
    @staticmethod
    def calculate_time_since_appearance(numbers: List[int], draws: List[Dict]) -> Dict[int, int]:
        """Calcul du nombre de tirages depuis la dernière apparition"""
        time_since = {}
        total_draws = len(draws)
        
        for num in numbers:
            last_index = -1
            for i in range(total_draws - 1, -1, -1):
                if num in draws[i].get('numbers', []):
                    last_index = i
                    break
            
            time_since[num] = total_draws - last_index - 1 if last_index != -1 else total_draws
        
        return time_since
    
    @staticmethod
    def generate_score(frequency: Dict[int, float], 
                      time_since: Dict[int, int],
                      recency_weight: float = 0.3) -> Dict[int, float]:
        """
        Génère un score pondéré pour chaque numéro
        
        Score = Fréquence (40%) + Absence longue (30%) + Tendance récente (30%)
        """
        scores = {}
        max_time = max(time_since.values()) if time_since else 1
        
        for num, freq in frequency.items():
            # Normaliser fréquence (0-100)
            freq_score = freq
            
            # Score d'absence (plus absent = plus haut score)
            absence_score = (time_since.get(num, 0) / max_time) * 100 if max_time > 0 else 0
            
            # Tendance récente (bonus si récent)
            recent_bonus = max(0, 10 - (time_since.get(num, 0) / max_time * 10))
            
            # Calcul final pondéré
            scores[num] = (freq_score * 0.40) + (absence_score * 0.30) + (recent_bonus * 0.30)
        
        return scores
    
    @staticmethod
    def get_top_numbers(scores: Dict[int, float], top_n: int = 10) -> List[Tuple[int, float]]:
        """Retourne les meilleurs numéros"""
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[:top_n]
    
    @staticmethod
    def analyze_balance(numbers: List[int], max_num: int) -> Dict[str, Dict[str, int]]:
        """Analyse l'équilibre (pair/impair, haut/bas)"""
        even = sum(1 for n in numbers if n % 2 == 0)
        odd = sum(1 for n in numbers if n % 2 == 1)
        
        low = sum(1 for n in numbers if n <= max_num // 2)
        high = sum(1 for n in numbers if n > max_num // 2)
        
        return {
            "parity": {"even": even, "odd": odd, "ratio": even / (odd + 1) if odd > 0 else even},
            "range": {"low": low, "high": high, "ratio": low / (high + 1) if high > 0 else low}
        }
    
    @staticmethod
    def chi_square_test(observed: List[int], expected: float) -> Tuple[float, float]:
        """Test chi-square de distribution"""
        chi_square = sum((obs - expected) ** 2 / expected for obs in observed)
        # p-value approximatif
        p_value = math.exp(-chi_square / 2)
        return chi_square, p_value


class SportsAnalyzer:
    """Analyseur pour paris sportifs"""
    
    @staticmethod
    def calculate_form(recent_results: List[str]) -> float:
        """Calcule la forme (W=1, D=0.5, L=0)"""
        if not recent_results:
            return 0.5
        
        points = sum(1 if r == 'W' else 0.5 if r == 'D' else 0 for r in recent_results)
        return points / len(recent_results)
    
    @staticmethod
    def calculate_goal_probability(avg_goals_for: float, avg_goals_against: float,
                                   avg_goals_league: float) -> Dict[str, float]:
        """Calcule la probabilité de buts (Poisson approx.)"""
        # Modèle simplifié Poisson
        attack_strength = avg_goals_for / avg_goals_league if avg_goals_league > 0 else 1
        defence_strength = avg_goals_against / avg_goals_league if avg_goals_league > 0 else 1
        
        expected_goals = attack_strength * defence_strength * avg_goals_league
        
        # Probas simples
        poisson_approx = {
            "under_2.5": sum(math.exp(-expected_goals) * (expected_goals ** k) / math.factorial(k) 
                           for k in range(3)),
            "over_2.5": 1 - sum(math.exp(-expected_goals) * (expected_goals ** k) / math.factorial(k) 
                               for k in range(3)),
            "expected_goals": expected_goals
        }
        
        return poisson_approx
    
    @staticmethod
    def generate_prediction(form_home: float, form_away: float,
                           avg_goals_home: float, avg_goals_away: float,
                           h2h_home_wins: int, h2h_total: int) -> Dict:
        """Génère une prédiction"""
        h2h_win_prob = h2h_home_wins / h2h_total if h2h_total > 0 else 0.33
        
        # Score attendu
        expected_goals_home = avg_goals_home * form_home
        expected_goals_away = avg_goals_away * form_away
        
        # Probabilités
        home_prob = (form_home * 0.40) + (h2h_win_prob * 0.30) + 0.30
        away_prob = (form_away * 0.40) + ((1 - h2h_win_prob) * 0.30) + 0.30
        draw_prob = 1 - home_prob - away_prob
        
        return {
            "probabilities": {
                "home_win": min(home_prob, 0.95),
                "draw": max(min(draw_prob, 0.95), 0),
                "away_win": min(away_prob, 0.95)
            },
            "expected_score": {
                "home": round(expected_goals_home, 1),
                "away": round(expected_goals_away, 1)
            },
            "form_advantage": "home" if form_home > form_away else "away" if form_away > form_home else "balanced",
            "confidence": round(max(home_prob, away_prob, draw_prob) * 100)
        }

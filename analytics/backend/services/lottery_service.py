"""
Service d'analyse des loteries
"""
from typing import List, Dict, Optional
from algorithms.statistical_analyzer import LotteryAnalyzer
from models import LotteryAnalysis, Recommendation, GridGenerated


class LotteryService:
    """Service pour l'orchestration de l'analyse de loteries"""
    
    def __init__(self, db):
        self.db = db
    
    async def analyze_lottery(self, lottery_type: str) -> Optional[LotteryAnalysis]:
        """Analyse complète d'une loterie"""
        
        draws_col = await self.db.get("draws")
        
        # Récupérer tous les tirages
        draws = await draws_col.find(
            {"lottery_type": lottery_type}
        ).to_list(None)
        
        if not draws:
            return None
        
        # Extraire tous les numéros
        all_numbers = []
        for draw in draws:
            all_numbers.extend(draw["numbers"])
        
        # Déterminer le nombre max (50 pour euromillions, 49 pour loto, 70 pour keno)
        max_number = max(all_numbers)
        
        # Calculs
        frequency = LotteryAnalyzer.calculate_frequency(all_numbers, max_number)
        mean_appearance = LotteryAnalyzer.calculate_mean_appearance(len(draws), max_number)
        anomalies = LotteryAnalyzer.detect_anomalies(frequency, mean_appearance)
        time_since = LotteryAnalyzer.calculate_time_since_appearance(all_numbers, draws)
        
        # Générer scores
        scores = {}
        for num in range(1, max_number + 1):
            freq = frequency.get(num, 0)
            absence = time_since.get(num, len(draws))
            scores[num] = LotteryAnalyzer.generate_score(freq, absence, anomalies)
        
        # Analyse de balance
        balance = LotteryAnalyzer.analyze_balance(all_numbers, max_number)
        
        # Chi-square test
        chi_square_result = LotteryAnalyzer.chi_square_test(frequency, mean_appearance)
        
        analysis = LotteryAnalysis(
            lottery_type=lottery_type,
            total_draws=len(draws),
            frequency=frequency,
            hot_numbers=anomalies["hot_numbers"],
            cold_numbers=anomalies["cold_numbers"],
            scores=scores,
            balance=balance,
            chi_square=chi_square_result["chi_square"],
            p_value=chi_square_result["p_value"],
            is_normal_distribution=chi_square_result["p_value"] > 0.05,
            std_dev=anomalies["std_dev"]
        )
        
        # Sauvegarder l'analyse
        analysis_col = await self.db.get("analysis")
        await analysis_col.update_one(
            {"lottery_type": lottery_type},
            {"$set": analysis.dict()},
            upsert=True
        )
        
        return analysis
    
    async def get_recommendations(self, lottery_type: str, top_n: int = 10) -> List[Recommendation]:
        """Génère des recommandations basées sur l'analyse"""
        
        # Récupérer l'analyse
        analysis_col = await self.db.get("analysis")
        analysis_data = await analysis_col.find_one({"lottery_type": lottery_type})
        
        if not analysis_data:
            # Faire une analyse si elle n'existe pas
            analysis = await self.analyze_lottery(lottery_type)
            if not analysis:
                return []
            analysis_data = analysis.dict()
        
        # Obtenir les top numéros
        scores = analysis_data["scores"]
        top_numbers = LotteryAnalyzer.get_top_numbers(scores, top_n)
        
        recommendations = []
        for i, num in enumerate(top_numbers, 1):
            score = scores.get(num, 0)
            
            # Détecter raison
            if num in analysis_data["hot_numbers"]:
                reason = f"Numéro chaud - apparaît {analysis_data['frequency'].get(str(num), 0):.1%} du temps"
            elif num in analysis_data["cold_numbers"]:
                reason = f"Numéro froid mais potentiellement en retard"
            else:
                reason = f"Équilibre bon - score {score:.1f}/100"
            
            rec = Recommendation(
                lottery_type=lottery_type,
                numbers=[num],
                score=int(score),
                confidence=min(int((score / 100) * 100), 95),
                reason=reason
            )
            recommendations.append(rec)
        
        return recommendations
    
    async def generate_grid(self, lottery_type: str, num_grids: int = 5) -> List[GridGenerated]:
        """Génère des grilles de jeu recommandées"""
        
        analysis_col = await self.db.get("analysis")
        draws_col = await self.db.get("draws")
        
        # Récupérer l'analyse
        analysis_data = await analysis_col.find_one({"lottery_type": lottery_type})
        if not analysis_data:
            analysis = await self.analyze_lottery(lottery_type)
            if not analysis:
                return []
            analysis_data = analysis.dict()
        
        # Déterminer paramètres
        if lottery_type == "keno":
            pick_count = 20
            max_number = 70
        elif lottery_type == "euromillions":
            pick_count = 5
            max_number = 50
        elif lottery_type == "loto":
            pick_count = 6
            max_number = 49
        else:
            return []
        
        scores = analysis_data["scores"]
        
        grids = []
        for i in range(num_grids):
            # Mélanger top/middle/low numbers
            all_nums = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            
            selected = []
            # Prendre 50% des top numbers
            top_count = pick_count // 2
            selected.extend([int(x[0]) for x in all_nums[:top_count]])
            
            # Compléter avec reste aléatoirement
            remaining = [x[0] for x in all_nums if x[0] not in selected]
            import random
            selected.extend(random.sample(remaining, pick_count - top_count))
            
            selected = sorted([int(x) for x in selected])
            avg_score = sum([scores.get(str(num), 0) for num in selected]) / len(selected)
            
            grid = GridGenerated(
                lottery_type=lottery_type,
                numbers=selected,
                reasoning=f"Grille {i+1}: Combinaison de numéros chauds et équilibrés",
                score=int(avg_score)
            )
            grids.append(grid)
        
        return grids
    
    async def get_statistics(self, lottery_type: str) -> Dict:
        """Récupère les statistiques complètes"""
        
        analysis_col = await self.db.get("analysis")
        analysis_data = await analysis_col.find_one({"lottery_type": lottery_type})
        
        if not analysis_data:
            analysis = await self.analyze_lottery(lottery_type)
            if not analysis:
                return {}
            analysis_data = analysis.dict()
        
        return {
            "lottery_type": lottery_type,
            "total_draws": analysis_data["total_draws"],
            "distribution_normal": analysis_data["is_normal_distribution"],
            "p_value": analysis_data["p_value"],
            "hot_count": len(analysis_data["hot_numbers"]),
            "cold_count": len(analysis_data["cold_numbers"]),
            "balance": analysis_data["balance"]
        }

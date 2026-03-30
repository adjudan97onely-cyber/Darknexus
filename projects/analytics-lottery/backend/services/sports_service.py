"""
Service d'analyse des matchs sportifs
"""
from typing import List, Dict, Optional
from algorithms.statistical_analyzer import SportsAnalyzer
from models import SportsPrediction
import random


class SportsService:
    """Service pour l'orchestration de l'analyse sportive"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_team_form(self, team_name: str, num_matches: int = 10) -> Dict:
        """Calcule la forme récente d'une équipe"""
        
        matches_col = await self.db.get("matches")
        
        # Récupérer les matchs récents
        recent_matches = await matches_col.find({
            "$or": [
                {"home_team": team_name},
                {"away_team": team_name}
            ]
        }).sort("date", -1).limit(num_matches).to_list(None)
        
        if not recent_matches:
            return {
                "team": team_name,
                "matches_found": 0,
                "form_score": 0,
                "results": []
            }
        
        # Extraire résultats
        results = []
        for match in recent_matches:
            if match["home_team"] == team_name:
                if match["goals_home"] > match["goals_away"]:
                    results.append("W")
                elif match["goals_home"] < match["goals_away"]:
                    results.append("L")
                else:
                    results.append("D")
            else:  # Away team
                if match["goals_away"] > match["goals_home"]:
                    results.append("W")
                elif match["goals_away"] < match["goals_home"]:
                    results.append("L")
                else:
                    results.append("D")
        
        form_score = SportsAnalyzer.calculate_form(results)
        
        return {
            "team": team_name,
            "matches_found": len(recent_matches),
            "form_score": form_score,
            "results": results,
            "form_rating": "Excellente" if form_score >= 0.7 else "Bonne" if form_score >= 0.5 else "Moyenne" if form_score >= 0.3 else "Mauvaise"
        }
    
    async def predict_match(self, home_team: str, away_team: str) -> SportsPrediction:
        """Prédit un match football"""
        
        matches_col = await self.db.get("matches")
        
        # Récupérer les formes
        home_form = await self.get_team_form(home_team)
        away_form = await self.get_team_form(away_team)
        
        home_form_score = home_form.get("form_score", 0.5)
        away_form_score = away_form.get("form_score", 0.5)
        
        # Récupérer l'historique h2h
        h2h = await matches_col.find({
            "$or": [
                {"$and": [{"home_team": home_team}, {"away_team": away_team}]},
                {"$and": [{"home_team": away_team}, {"away_team": home_team}]}
            ]
        }).to_list(None)
        
        # Calculer h2h stats
        home_wins = sum(1 for m in h2h if m["home_team"] == home_team and m["goals_home"] > m["goals_away"])
        away_wins = sum(1 for m in h2h if m["away_team"] == home_team and m["goals_away"] > m["goals_home"])
        draws = sum(1 for m in h2h if m["goals_home"] == m["goals_away"])
        
        home_h2h_score = home_wins / len(h2h) if h2h else 0.5
        
        # Générer prédiction
        prediction = SportsAnalyzer.generate_prediction(
            home_form=home_form_score,
            away_form=away_form_score,
            head_to_head_advantage=home_h2h_score
        )
        
        # Créer le modèle
        sports_pred = SportsPrediction(
            match_id=f"{home_team}_vs_{away_team}",
            home_team=home_team,
            away_team=away_team,
            home_probability=prediction["home_win"],
            draw_probability=prediction["draw"],
            away_probability=prediction["away_win"],
            expected_score_home=prediction["expected_score"][0],
            expected_score_away=prediction["expected_score"][1],
            over_2_5=prediction["over_2_5"],
            confidence=min(int(prediction["confidence"] * 100), 95),
            recommendation=self._get_recommendation(prediction["probabilities"])
        )
        
        return sports_pred
    
    async def predict_matches_batch(self, matches: List[Dict]) -> List[SportsPrediction]:
        """Prédit plusieurs matchs"""
        
        predictions = []
        for match in matches:
            pred = await self.predict_match(match["home"], match["away"])
            predictions.append(pred)
        
        return predictions
    
    async def get_live_recommendations(self, sport: str = "football") -> List[Dict]:
        """Récupère les recommandations actuelles"""
        
        matches_col = await self.db.get("matches")
        
        # Récupérer les matchs prochains (simulation)
        upcoming = await matches_col.find(
            {"sport": sport}
        ).sort("date", 1).limit(5).to_list(None)
        
        recommendations = []
        for match in upcoming:
            pred = await self.predict_match(match["home_team"], match["away_team"])
            
            # Déterminer meilleur pari
            if pred.home_probability > pred.away_probability and pred.home_probability > pred.draw_probability:
                best_bet = "1"
                bet_prob = pred.home_probability
                reasoning = f"{match['home_team']} en très bonne forme"
            elif pred.away_probability > pred.home_probability and pred.away_probability > pred.draw_probability:
                best_bet = "2"
                bet_prob = pred.away_probability
                reasoning = f"{match['away_team']} en excellente forme"
            else:
                best_bet = "N"
                bet_prob = pred.draw_probability
                reasoning = "Égalité probable - équipes équilibrées"
            
            recommendations.append({
                "match": f"{match['home_team']} vs {match['away_team']}",
                "best_bet": best_bet,
                "probability": bet_prob,
                "confidence": pred.confidence,
                "reasoning": reasoning
            })
        
        return recommendations
    
    def _get_recommendation(self, probabilities: Dict) -> str:
        """Génère une recommandation textuelle"""
        
        home_prob = probabilities.get("home_win", 0)
        draw_prob = probabilities.get("draw", 0)
        away_prob = probabilities.get("away_win", 0)
        
        if home_prob > 0.50:
            return "Victoire locale probable"
        elif away_prob > 0.50:
            return "Victoire extérieure probable"
        elif draw_prob > 0.40:
            return "Match équilibré - Égalité possible"
        else:
            return "Aucun favori net"
    
    async def get_sports_statistics(self) -> Dict:
        """Récupère les statistiques sportives globales"""
        
        matches_col = await self.db.get("matches")
        
        all_matches = await matches_col.find({}).to_list(None)
        
        if not all_matches:
            return {}
        
        total_matches = len(all_matches)
        home_wins = sum(1 for m in all_matches if m["goals_home"] > m["goals_away"])
        away_wins = sum(1 for m in all_matches if m["goals_away"] > m["goals_home"])
        draws = total_matches - home_wins - away_wins
        
        total_goals = sum(m["goals_home"] + m["goals_away"] for m in all_matches)
        avg_goals = total_goals / total_matches if total_matches else 0
        
        return {
            "total_matches": total_matches,
            "home_win_rate": home_wins / total_matches if total_matches else 0,
            "away_win_rate": away_wins / total_matches if total_matches else 0,
            "draw_rate": draws / total_matches if total_matches else 0,
            "average_goals": avg_goals,
            "over_2_5_rate": sum(1 for m in all_matches if m["goals_home"] + m["goals_away"] > 2.5) / total_matches if total_matches else 0
        }

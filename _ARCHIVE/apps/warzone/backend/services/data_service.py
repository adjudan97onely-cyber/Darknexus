"""
Service pour gestion des données de Loteries
"""
from datetime import datetime, timedelta
import random
from typing import List, Dict


class SampleDataGenerator:
    """Génère des données de sample pour démo (Phase 1)"""
    
    @staticmethod
    def generate_lottery_history(lottery_type: str, num_draws: int = 100) -> List[Dict]:
        """Génère un historique de tirages fictifs mais réalistes"""
        
        if lottery_type == "keno":
            num_count = 70
            pick_count = 20
        elif lottery_type == "euromillions":
            num_count = 50
            pick_count = 5
        elif lottery_type == "loto":
            num_count = 49
            pick_count = 6
        else:
            return []
        
        draws = []
        base_date = datetime.now() - timedelta(days=num_draws)
        
        for i in range(num_draws):
            numbers = sorted(random.sample(range(1, num_count + 1), pick_count))
            bonus = random.randint(1, num_count) if lottery_type == "euromillions" else None
            
            draws.append({
                "draw_id": f"{lottery_type}_{i}",
                "lottery_type": lottery_type,
                "date": base_date + timedelta(days=i),
                "numbers": numbers,
                "bonus": bonus
            })
        
        return draws
    
    @staticmethod
    def generate_sports_history(num_matches: int = 50) -> List[Dict]:
        """Génère un historique de matchs fictifs"""
        
        teams = ["PSG", "OM", "Monaco", "OL", "Lille", "Rennes", "Lens", "Nice"]
        leagues = ["Ligue 1"]
        
        matches = []
        base_date = datetime.now() - timedelta(days=num_matches)
        
        for i in range(num_matches):
            home = random.choice(teams)
            away = random.choice([t for t in teams if t != home])
            goals_home = random.randint(0, 4)
            goals_away = random.randint(0, 4)
            
            matches.append({
                "match_id": f"match_{i}",
                "sport": "football",
                "date": base_date + timedelta(days=i),
                "home_team": home,
                "away_team": away,
                "league": "Ligue 1",
                "goals_home": goals_home,
                "goals_away": goals_away,
                "result": "H" if goals_home > goals_away else "A" if goals_away > goals_home else "D"
            })
        
        return matches


class DataService:
    """Service de gestion des données"""
    
    def __init__(self, db):
        self.db = db
    
    async def initialize_sample_data(self):
        """Initialise les données de sample"""
        # Vérifier si données existent déjà
        draws_col = await self.db["draws"]
        existing = await draws_col.count_documents({})
        if existing == 0:
            # Insérer Keno
            keno_data = SampleDataGenerator.generate_lottery_history("keno")
            for draw in keno_data:
                draw["numbers"] = ",".join(map(str, draw["numbers"]))  # Convertir en string pour SQLite
                await draws_col.insert_one(draw)
            
            # Insérer Euromillions
            euro_data = SampleDataGenerator.generate_lottery_history("euromillions")
            for draw in euro_data:
                draw["numbers"] = ",".join(map(str, draw["numbers"]))
                await draws_col.insert_one(draw)
            
            # Insérer Loto
            loto_data = SampleDataGenerator.generate_lottery_history("loto")
            for draw in loto_data:
                draw["numbers"] = ",".join(map(str, draw["numbers"]))
                await draws_col.insert_one(draw)
        
            # Insérer matchs
            matches_col = await self.db["matches"]
            matches_data = SampleDataGenerator.generate_sports_history()
            for match in matches_data:
                await matches_col.insert_one(match)
            
            return True
        
        return False

"""
Script de test - Vérifier que l'API football fonctionne correctement
"""

import asyncio
import httpx
from datetime import datetime, timedelta

OPENLIGA_BASE = "https://www.openligadb.de/api"


async def test_api():
    """Test l'API OpenLigaDB"""
    print("🧪 Test API OpenLigaDB\n")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test 1: Récupérer les ligues
            print("1️⃣ Récupération des ligues...")
            url = f"{OPENLIGA_BASE}/Leagues"
            response = await client.get(url)
            response.raise_for_status()
            leagues = response.json()
            print(f"✅ {len(leagues)} ligues trouvées")
            for league in leagues[:5]:
                print(f"   - {league.get('LeagueName')} ({league.get('LeagueShortcut')})")
            
            # Test 2: Récupérer les matchs d'une ligue spécifique
            print("\n2️⃣ Récupération des matchs de la Bundesliga...")
            url = f"{OPENLIGA_BASE}/Matches"
            params = {'leagueShortcut': 'BL', 'season': 2025}
            response = await client.get(url, params=params)
            response.raise_for_status()
            matches = response.json()
            print(f"✅ {len(matches)} matchs trouvés")
            
            # Afficher les prochains matchs
            upcoming = [m for m in matches if '_links' in m and m.get('MatchIsFinished') == False][:3]
            for match in upcoming:
                home = match.get('Team1', {}).get('TeamName', 'Unknown')
                away = match.get('Team2', {}).get('TeamName', 'Unknown')
                try:
                    match_date = match.get('MatchDateTime', '').split('T')[0]
                except:
                    match_date = 'TBD'
                print(f"   - {home} vs {away} ({match_date})")
            
            # Test 3: Récupérer les ligues pour cette saison
            print("\n3️⃣ Vérification des saisons disponibles...")
            for league_code in ['BL', 'L1', 'PL', 'SA', 'LL']:
                url = f"{OPENLIGA_BASE}/Matches"
                params = {'leagueShortcut': league_code, 'season': 2025}
                response = await client.get(url, params=params)
                matches = response.json()
                print(f"   - {league_code}: {len(matches)} matchs")
            
            print("\n✅ Test API réussi!")
            return True
    
    except Exception as e:
        print(f"❌ Erreur test API: {e}")
        return False


async def test_league_countries():
    """Test la récupération des matchs par pays"""
    print("\n🌍 Test récupération par pays\n")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Récupérer Bundesliga et vérifier le pays
            url = f"{OPENLIGA_BASE}/Matches"
            params = {'leagueShortcut': 'BL', 'season': 2025}
            response = await client.get(url, params=params)
            response.raise_for_status()
            matches = response.json()
            
            if matches:
                match = matches[0]
                print(f"Exemple de match Bundesliga:")
                print(f"  Home: {match.get('Team1', {}).get('TeamName')}")
                print(f"  Away: {match.get('Team2', {}).get('TeamName')}")
                print(f"  Pays: {match.get('League', {}).get('LeagueCountryName')}")
                
                return True
    except Exception as e:
        print(f"❌ Erreur test pays: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(test_api())
    asyncio.run(test_league_countries())

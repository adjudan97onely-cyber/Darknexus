import asyncio
import httpx
import json

async def test():
    try:
        print("\nTest: Decouvrir les vrais endpoints\n")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # GetAvailableLeagues retourne 200!
            response = await client.get("https://api.openligadb.de/GetAvailableLeagues")
            print(f"GetAvailableLeagues: {response.status_code}")
            leagues = response.json()
            print(f"  -> {len(leagues)} ligues trouvees")
            if len(leagues) > 0:
                print(f"  Sample: {leagues[0]}")
            print()
            
            # Essayer les autres patterns
            patterns = [
                "GetMatchesByLeagueID/{league_id}/{season}",
                "GetMatchesByLeague",
                "GetAvailableTeams",
                "GetTeamsByLeagueID/{id}",
            ]
            
            # Essayer avec une vraie ligue
            if len(leagues) > 0:
                league = leagues[0]
                print(f"Using league: {league}")
                
                # Chercher les matchs
                urls = [
                    f"https://api.openligadb.de/GetMatchesByLeagueID/{league.get(league_id or 'LeagueId', '')}/2024",
                    f"https://api.openligadb.de/GetMatchesByLeague/2024/BL",
                ]
                
                # Tester sans parametres d'abord
                test_urls = [
                    "https://api.openligadb.de/GetMatches", 
                    "https://api.openligadb.de/getmatches",
                    "https://api.openligadb.de/matches/2024/BL"
                ]
                
                for url in test_urls:
                    try:
                        response = await client.get(url)
                        print(f"GET {url.split('/')[-1]}: {response.status_code}")
                    except:
                        pass

asyncio.run(test())




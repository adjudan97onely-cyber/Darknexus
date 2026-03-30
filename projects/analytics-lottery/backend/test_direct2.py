import asyncio
import httpx

async def test():
    print("Test: Decouvrir les vrais endpoints\n")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # GetAvailableLeagues retourne 200
        response = await client.get("https://api.openligadb.de/GetAvailableLeagues")
        print(f"GetAvailableLeagues: {response.status_code}")
        
        if response.status_code == 200:
            leagues = response.json()
            print(f"  -> {len(leagues)} ligues\n")
            
            # Montrer quelques ligues
            for league in leagues[:3]:
                league_id = league.get('LeagueID') or league.get('leagueid') or league.get('id')
                league_name = league.get('LeagueName') or league.get('leaguename') or 'Unknown'
                print(f"  League: {league_name} (ID: {league_id})")
            
            print("\nTest endpoints avec league:")
            
            # Tester les vrais patterns
            if len(leagues) > 0:
                test_league = leagues[0]
                league_id = test_league.get('LeagueID')
                
                test_urls = [
                    f"https://api.openligadb.de/GetMatchesByLeagueID/{league_id}/2024",
                    f"https://api.openligadb.de/GetTeamsByLeagueID/{league_id}",
                ]
                
                for url in test_urls:
                    try:
                        resp = await client.get(url)
                        print(f"  {url.split('/')[-3]}/{url.split('/')[-2]}: {resp.status_code}")
                    except Exception as e:
                        print(f"  Error: {e}")

asyncio.run(test())

import asyncio
import httpx
import json

async def test():
    print("Getting leagues structure...\n")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("https://api.openligadb.de/GetAvailableLeagues")
        
        if response.status_code == 200:
            leagues = response.json()
            print(f"Total leagues: {len(leagues)}\n")
            print("First league structure:")
            print(json.dumps(leagues[0], indent=2))

asyncio.run(test())

#!/usr/bin/env python3
"""
VALIDATION COMPLÈTE DES ENDPOINTS - Simule les appels du frontend
"""
import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name, status, detail=""):
    """Affiche un résultat de test"""
    icon = f"{Colors.GREEN}✅{Colors.RESET}" if status else f"{Colors.RED}❌{Colors.RESET}"
    print(f"{icon} {name:<40} {detail}")

def test_endpoint(method, endpoint, params=None):
    """Teste un endpoint et retourne (success, status_code, data)"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            resp = requests.get(url, params=params, timeout=5)
        elif method == "POST":
            resp = requests.post(url, json=params, timeout=5)
        
        success = resp.status_code == 200
        return success, resp.status_code, resp.json() if success else resp.text[:100]
    except Exception as e:
        return False, None, str(e)[:100]

def main():
    print(f"\n{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BLUE}🧪 TEST COMPLET - SIMULATION APPELS FRONTEND{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*70}{Colors.RESET}\n")
    
    # 1. ADMIN ENDPOINTS
    print(f"{Colors.YELLOW}📋 1. ADMIN ENDPOINTS{Colors.RESET}")
    success, code, data = test_endpoint("GET", "/admin/health")
    print_test("Admin Health", success, f"({code})")
    
    # 2. SPORTS ENDPOINTS
    print(f"\n{Colors.YELLOW}📋 2. SPORTS ENDPOINTS{Colors.RESET}")
    
    success, code, data = test_endpoint("GET", "/sports/leagues")
    print_test("Get Leagues", success, f"({code})")
    if success:
        leagues_count = len(data.get("data", []))
        print(f"   └─ {leagues_count} ligues trouvées")
    
    success, code, data = test_endpoint("GET", "/sports/matches")
    print_test("Get Matches", success, f"({code})")
    if success:
        matches_count = len(data.get("data", []))
        print(f"   └─ {matches_count} matchs trouvés")
    
    success, code, data = test_endpoint("GET", "/sports/statistics")
    print_test("Get Statistics", success, f"({code})")
    
    success, code, data = test_endpoint("GET", "/sports/recommendations", 
                                       {"min_confidence": 70, "take": 10})
    print_test("Get Recommendations", success, f"({code})")
    
    # 3. KENO ENDPOINTS
    print(f"\n{Colors.YELLOW}📋 3. KENO ENDPOINTS{Colors.RESET}")
    
    success, code, data = test_endpoint("GET", "/lotteries/keno/analysis")
    print_test("Keno Analysis", success, f"({code})")
    if success:
        nums = data.get("analysis", {}).get("predicted_numbers", [])
        print(f"   └─ Prédiction: {nums[:5]}...")
    
    success, code, data = test_endpoint("GET", "/lotteries/grids/keno", {"num_grids": 3})
    print_test("Keno Grids", success, f"({code})")
    if success:
        print(f"   └─ {len(data.get('grids', []))} grilles générées")
    
    success, code, data = test_endpoint("GET", "/lotteries/results/latest", {"lottery": "keno"})
    print_test("Keno Latest Results", success, f"({code})")
    if success:
        nums = data.get("result", {}).get("numbers", [])
        print(f"   └─ Derniers numéros: {nums}")
    
    success, code, data = test_endpoint("GET", "/lotteries/results/history", {"lottery": "keno"})
    print_test("Keno History", success, f"({code})")
    if success:
        count = len(data.get("history", []))
        print(f"   └─ {count} résultats historiques")
    
    # 4. LOTO ENDPOINTS
    print(f"\n{Colors.YELLOW}📋 4. LOTO ENDPOINTS{Colors.RESET}")
    
    success, code, data = test_endpoint("GET", "/lotteries/loto/analysis")
    print_test("Loto Analysis", success, f"({code})")
    
    success, code, data = test_endpoint("GET", "/lotteries/results/latest", {"lottery": "loto"})
    print_test("Loto Latest Results", success, f"({code})")
    if success:
        nums = data.get("result", {}).get("numbers", [])
        print(f"   └─ Numéros: {nums}")
    
    # 5. EUROMILLIONS ENDPOINTS
    print(f"\n{Colors.YELLOW}📋 5. EUROMILLIONS ENDPOINTS{Colors.RESET}")
    
    success, code, data = test_endpoint("GET", "/lotteries/euromillions/analysis")
    print_test("EuroMillions Analysis", success, f"({code})")
    
    success, code, data = test_endpoint("GET", "/lotteries/results/latest", {"lottery": "euromillions"})
    print_test("EuroMillions Latest Results", success, f"({code})")
    if success:
        nums = data.get("result", {}).get("numbers", [])
        stars = data.get("result", {}).get("stars", [])
        print(f"   └─ Numéros: {nums} | Étoiles: {stars}")
    
    # 6. PREDICTIONS ENDPOINTS
    print(f"\n{Colors.YELLOW}📋 6. PREDICTIONS ENDPOINTS{Colors.RESET}")
    
    success, code, data = test_endpoint("GET", "/predictions/enriched/health")
    print_test("Predictions Health", success, f"({code})")
    
    print(f"\n{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BLUE}✅ TESTS TERMINÉS - Vérifiez F12 dans le navigateur{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*70}\n")
    
    return 0

if __name__ == "__main__":
    import time
    time.sleep(1)
    sys.exit(main())

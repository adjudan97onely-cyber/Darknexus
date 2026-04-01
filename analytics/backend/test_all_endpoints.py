#!/usr/bin/env python3
"""
🔥 TESTE TOUS LES ENDPOINTS - Script de vérification complet
Vérifie que le backend répond correctement à tous les endpoints utilisés par le frontend
"""
import requests
import json
import sys
from datetime import datetime

API_URL = "http://localhost:5000"
ADMIN_PASSWORD = "LorenZ971972@"
ADMIN_TOKEN = None

print(f"🔍 TEST DES ENDPOINTS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"🎯 Target: {API_URL}")
print("=" * 80)

def test_endpoint(method, path, expected_status=200, data=None, headers=None):
    """Test un endpoint et retourne le résultat"""
    url = f"{API_URL}{path}"
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            return "❌", "Méthode inconnue", None
        
        status = "✅" if resp.status_code == expected_status else "❌"
        message = f"{resp.status_code} - {resp.reason}"
        
        try:
            data = resp.json() if resp.text else None
        except:
            data = resp.text[:100]
        
        return status, message, data
    except requests.exceptions.Timeout:
        return "⏱️", "TIMEOUT (5s)", None
    except requests.exceptions.ConnectionError:
        return "🔴", "CONNEXION REFUSÉE", None
    except Exception as e:
        return "❌", str(e)[:50], None

# Test de connexion
print("\n📡 TEST CONNEXION")
status, msg, data = test_endpoint("GET", "/", 200)
print(f"  {status} GET / → {msg}")

# Admin Login
print("\n🔐 ADMIN AUTH")
status, msg, data = test_endpoint("POST", "/api/admin/login", 200, 
                                  {"password": ADMIN_PASSWORD, "email": "admin@example.com"})
print(f"  {status} POST /api/admin/login → {msg}")
if status == "✅" and data:
    try:
        ADMIN_TOKEN = data.get("access_token")
        print(f"      → Token obtenu: {ADMIN_TOKEN[:20]}...")
    except:
        pass

# Admin endpoints (avec token si dispo)
admin_headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"} if ADMIN_TOKEN else {}

print("\n📊 ADMIN ENDPOINTS")
endpoints_admin = [
    ("GET", "/api/admin/stats"),
    ("GET", "/api/admin/performance"),
    ("GET", "/api/admin/predictions"),
    ("GET", "/api/admin/database-info"),
]

for method, path in endpoints_admin:
    status, msg, _ = test_endpoint(method, path, 200, headers=admin_headers)
    print(f"  {status} {method} {path} → {msg}")

print("\n⚽ SPORTS ENDPOINTS")
endpoints_sports = [
    ("GET", "/api/sports/leagues"),
    ("GET", "/api/sports/matches"),
    ("GET", "/api/sports/statistics"),
    ("GET", "/api/sports/recommendations"),
]

for method, path in endpoints_sports:
    status, msg, _ = test_endpoint(method, path, 200)
    print(f"  {status} {method} {path} → {msg}")

print("\n🎰 LOTTERIES ENDPOINTS")
endpoints_lotteries = [
    ("GET", "/api/lotteries/keno/analysis"),
    ("GET", "/api/lotteries/loto/analysis"),
    ("GET", "/api/lotteries/euromillions/analysis"),
    ("GET", "/api/lotteries/grids/keno"),
    ("GET", "/api/lotteries/results/latest?lottery=keno"),
    ("GET", "/api/lotteries/results/history?lottery=keno"),
]

for method, path in endpoints_lotteries:
    status, msg, _ = test_endpoint(method, path, 200)
    print(f"  {status} {method} {path} → {msg}")

print("\n💊 HEALTH ENDPOINTS")
endpoints_health = [
    ("GET", "/api/admin/health"),
    ("GET", "/api/predictions/enriched/health"),
    ("GET", "/health"),
]

for method, path in endpoints_health:
    status, msg, _ = test_endpoint(method, path, 200)
    print(f"  {status} {method} {path} → {msg}")

print("\n" + "=" * 80)
print("✅ TEST TERMINÉ")
print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

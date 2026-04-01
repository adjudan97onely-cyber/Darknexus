#!/usr/bin/env python3
"""
Test des endpoints de résultats de loterie
"""
import requests
import sys

BASE_URL = "http://localhost:5001/api"

def test_results():
    print("\n" + "="*60)
    print("🧪 TESTING RESULTS ENDPOINTS")
    print("="*60 + "\n")
    
    tests = [
        ("Latest Keno", f"{BASE_URL}/lotteries/results/latest?lottery=keno"),
        ("Latest Loto", f"{BASE_URL}/lotteries/results/latest?lottery=loto"),
        ("Latest EuroMillions", f"{BASE_URL}/lotteries/results/latest?lottery=euromillions"),
        ("History Keno", f"{BASE_URL}/lotteries/results/history?lottery=keno"),
        ("History Loto", f"{BASE_URL}/lotteries/results/history?lottery=loto"),
        ("History EuroMillions", f"{BASE_URL}/lotteries/results/history?lottery=euromillions"),
    ]
    
    passed = 0
    failed = 0
    
    for name, url in tests:
        try:
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name:<25} 200 OK")
                print(f"   Response: {str(data)[:80]}...")
                passed += 1
            else:
                print(f"❌ {name:<25} {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"❌ {name:<25} ERROR: {str(e)[:50]}")
            failed += 1
    
    print("\n" + "="*60)
    print(f"📊 Results: {passed} passed, {failed} failed")
    print("="*60 + "\n")
    
    return failed == 0

if __name__ == "__main__":
    import time
    time.sleep(2)  # Wait for server
    success = test_results()
    sys.exit(0 if success else 1)

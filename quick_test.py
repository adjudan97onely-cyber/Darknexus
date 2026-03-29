#!/usr/bin/env python3
"""
🚀 QUICK TEST - Vérifie rapidement que tout marche
"""
import requests
import time

print("\n" + "="*60)
print("🚀 QUICK VALIDATION    - tout fonctionne?")
print("="*60)

API = "http://localhost:5000"
ADMIN_PASSWORD = "LorenZ971972@"

checks = []

# 1. Backend tourne?
try:
    r = requests.get(f"{API}/api/admin/health", timeout=2)
    if r.status_code == 200:
        checks.append(("✅", "Backend tourne (port 5000)"))
    else:
        checks.append(("⚠️", f"Backend répond mais status {r.status_code}"))
except:
    checks.append(("❌", "Backend ne répond pas!"))

# 2. Login admin?
try:
    r = requests.post(f"{API}/api/admin/login", 
                     json={"password": ADMIN_PASSWORD, "email": "admin@example.com"},
                     timeout=2)
    if r.status_code == 200 and r.json().get("access_token"):
        token = r.json()["access_token"][:20] + "..."
        checks.append(("✅", f"Admin auth OK (Token: {token})"))
    else:
        checks.append(("⚠️", "Admin auth failed"))
except Exception as e:
    checks.append(("❌", f"Admin auth error: {str(e)[:30]}"))

# 3. Sports data?
try:
    r = requests.get(f"{API}/api/sports/matches", timeout=2)
    if r.status_code == 200 and r.json():
        data = r.json()
        count = len(data) if isinstance(data, list) else 1
        checks.append(("✅", f"Sports data OK ({count} items)"))
    else:
        checks.append(("⚠️", "Sports data empty"))
except:
    checks.append(("❌", "Sports endpoint failed"))

# 4. Lottery data?
try:
    r = requests.get(f"{API}/api/lotteries/keno/analysis", timeout=2)
    if r.status_code == 200:
        checks.append(("✅", "Keno analysis OK"))
    else:
        checks.append(("⚠️", f"Keno status {r.status_code}"))
except:
    checks.append(("❌", "Keno endpoint failed"))

# 5. Latest results?
try:
    r = requests.get(f"{API}/api/lotteries/results/latest?lottery=keno", timeout=2)
    if r.status_code == 200:
        checks.append(("✅", "Latest results OK"))
    else:
        checks.append(("⚠️", f"Results status {r.status_code}"))
except:
    checks.append(("❌", "Results endpoint failed"))

print()
for icon, msg in checks:
    print(f"  {icon} {msg}")

print("\n" + "="*60)
success_count = sum(1 for icon, _ in checks if icon == "✅")
total = len(checks)
print(f"🎯 RÉSULTAT: {success_count}/{total} checks passed")
if success_count == total:
    print("   → ✅ EVERYTHING IS WORKING! 🎉")
else:
    print(f"   → ⚠️ {total - success_count} issues to fix")
print("="*60 + "\n")

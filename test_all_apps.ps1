# ============================================================
# TEST COMPLET DES 4 APPS - DARKNEXUS
# ============================================================
$results = @()

function T($label, $url, $method="GET", $token=$null, $jsonBody=$null, $noAuth=$false) {
    $headers = @{}
    if ($token -and -not $noAuth) { $headers["Authorization"] = "Bearer $token" }
    try {
        $params = @{ Uri=$url; Method=$method; TimeoutSec=5; ErrorAction="Stop" }
        if ($headers.Count) { $params["Headers"] = $headers }
        if ($jsonBody) { $params["Body"] = $jsonBody; $params["ContentType"] = "application/json" }
        $r = Invoke-RestMethod @params
        $preview = ($r | ConvertTo-Json -Compress -Depth 2).Substring(0, [Math]::Min(80, ($r | ConvertTo-Json -Compress -Depth 2).Length))
        return "✅  $label → $preview"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $msg = $_.ErrorDetails.Message
        if ($msg.Length -gt 80) { $msg = $msg.Substring(0,80) }
        return "❌  $label → HTTP $code | $msg"
    }
}

# ============================================================
# APP 1 — DARKNEXUS :5000
# ============================================================
Write-Host "`n========== DARKNEXUS :5000 ==========" -ForegroundColor Cyan

# Login
try {
    $r = Invoke-RestMethod "http://localhost:5000/api/auth/login" -Method POST -Body '{"email":"adjudan97one.ly@gmail.com","password":"LorenZ971972@"}' -ContentType "application/json" -TimeoutSec 5
    $TK = $r.access_token
    Write-Host "✅  LOGIN → JWT OK" -ForegroundColor Green
} catch {
    Write-Host "❌  LOGIN → ECHEC: $_" -ForegroundColor Red
    $TK = ""
}

# Endpoints Darknexus
$dn_tests = @(
    (T "GET /api/auth/me" "http://localhost:5000/api/auth/me" "GET" $TK),
    (T "GET /api/projects/" "http://localhost:5000/api/projects/" "GET" $TK),
    (T "POST /api/projects/ (créer)" "http://localhost:5000/api/projects/" "POST" $TK '{"name":"Test projet","description":"test auto","type":"web"}'),
    (T "GET /api/assistant/conversations" "http://localhost:5000/api/assistant/conversations" "GET" $TK),
    (T "POST /api/assistant/chat" "http://localhost:5000/api/assistant/chat" "POST" $TK '{"message":"Bonjour","conversation_id":null}'),
    (T "GET /api/copilot/status" "http://localhost:5000/api/copilot/status" "GET" $TK),
    (T "GET /api/admin/stats" "http://localhost:5000/api/admin/stats" "GET" $TK),
    (T "GET /api/scraper/history" "http://localhost:5000/api/scraper/history" "GET" $TK),
    (T "GET /docs (Swagger)" "http://localhost:5000/docs" "GET" $null $null $true)
)
$dn_tests | ForEach-Object { 
    if ($_ -match "^✅") { Write-Host $_ -ForegroundColor Green } else { Write-Host $_ -ForegroundColor Red }
}

# ============================================================
# APP 2 — ANALYTICS :5001
# ============================================================
Write-Host "`n========== ANALYTICS :5001 ==========" -ForegroundColor Cyan

$an_tests = @(
    (T "GET / (root)" "http://localhost:5001/" "GET" $null $null $true),
    (T "GET /health" "http://localhost:5001/health" "GET" $null $null $true),
    (T "GET /api/lotteries/" "http://localhost:5001/api/lotteries/" "GET" $null $null $true),
    (T "GET /api/lotteries/types" "http://localhost:5001/api/lotteries/types" "GET" $null $null $true),
    (T "GET /api/lotteries/history" "http://localhost:5001/api/lotteries/history" "GET" $null $null $true),
    (T "GET /api/lotteries/latest" "http://localhost:5001/api/lotteries/latest" "GET" $null $null $true),
    (T "POST /api/lotteries/predict" "http://localhost:5001/api/lotteries/predict" "POST" $null '{"lottery_type":"euromillions"}' $true),
    (T "GET /api/sports/" "http://localhost:5001/api/sports/" "GET" $null $null $true),
    (T "GET /api/sports/leagues" "http://localhost:5001/api/sports/leagues" "GET" $null $null $true),
    (T "GET /api/sports/recommendations" "http://localhost:5001/api/sports/recommendations" "GET" $null $null $true),
    (T "GET /api/dashboard/overview" "http://localhost:5001/api/dashboard/overview" "GET" $null $null $true),
    (T "GET /api/performance" "http://localhost:5001/api/performance" "GET" $null $null $true),
    (T "GET /api/notifications" "http://localhost:5001/api/notifications" "GET" $null $null $true),
    (T "GET /api/results/recent/paginated" "http://localhost:5001/api/results/recent/paginated" "GET" $null $null $true),
    (T "GET /api/predictions/history/paginated" "http://localhost:5001/api/predictions/history/paginated" "GET" $null $null $true)
)
$an_tests | ForEach-Object { 
    if ($_ -match "^✅") { Write-Host $_ -ForegroundColor Green } else { Write-Host $_ -ForegroundColor Red }
}

# ============================================================
# APP 3 — KILLAGAIN FOOD :5002
# ============================================================
Write-Host "`n========== KILLAGAIN FOOD :5002 ==========" -ForegroundColor Cyan

$kf_tests = @(
    (T "GET /health" "http://localhost:5002/health" "GET" $null $null $true),
    (T "GET /api/recipes" "http://localhost:5002/api/recipes" "GET" $null $null $true),
    (T "GET /api/recipes/popular" "http://localhost:5002/api/recipes/popular" "GET" $null $null $true),
    (T "POST /api/recipes/generate" "http://localhost:5002/api/recipes/generate" "POST" $null '{"ingredients":["poulet","tomates"],"diet":"none"}' $true),
    (T "POST /api/assistant/chat" "http://localhost:5002/api/assistant/chat" "POST" $null '{"message":"Bonjour","session_id":"test"}' $true),
    (T "POST /api/scanner/analyze" "http://localhost:5002/api/scanner/analyze" "POST" $null '{"ingredients":["oeufs","farine"]}' $true),
    (T "GET /api/nutrition/plans" "http://localhost:5002/api/nutrition/plans" "GET" $null $null $true),
    (T "GET /api/favorites" "http://localhost:5002/api/favorites" "GET" $null $null $true)
)
$kf_tests | ForEach-Object { 
    if ($_ -match "^✅") { Write-Host $_ -ForegroundColor Green } else { Write-Host $_ -ForegroundColor Red }
}

# ============================================================
# APP 4 — WARZONE :5003
# ============================================================
Write-Host "`n========== WARZONE :5003 ==========" -ForegroundColor Cyan

$wz_tests = @(
    (T "GET / (root)" "http://localhost:5003/" "GET" $null $null $true),
    (T "GET /api/weapons" "http://localhost:5003/api/weapons" "GET" $null $null $true),
    (T "GET /api/weapons/categories" "http://localhost:5003/api/weapons/categories" "GET" $null $null $true),
    (T "GET /api/weapons/meta" "http://localhost:5003/api/weapons/meta" "GET" $null $null $true),
    (T "POST /api/chat" "http://localhost:5003/api/chat" "POST" $null '{"message":"Quelle est la meilleure arme?","session_id":"test-session"}' $true),
    (T "GET /api/chat/test-session" "http://localhost:5003/api/chat/test-session" "GET" $null $null $true),
    (T "GET /api/loadouts" "http://localhost:5003/api/loadouts" "GET" $null $null $true),
    (T "GET /api/stats" "http://localhost:5003/api/stats" "GET" $null $null $true),
    (T "GET /api/settings" "http://localhost:5003/api/settings" "GET" $null $null $true),
    (T "GET /docs (Swagger)" "http://localhost:5003/docs" "GET" $null $null $true)
)
$wz_tests | ForEach-Object { 
    if ($_ -match "^✅") { Write-Host $_ -ForegroundColor Green } else { Write-Host $_ -ForegroundColor Red }
}

Write-Host "`n========== FIN DES TESTS ==========" -ForegroundColor Yellow

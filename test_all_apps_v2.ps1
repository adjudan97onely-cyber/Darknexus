# ============================================================
# TEST COMPLET AVEC LES VRAIES ROUTES
# ============================================================

function T($label, $url, $method="GET", $token=$null, $jsonBody=$null) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    try {
        $params = @{ Uri=$url; Method=$method; TimeoutSec=8; ErrorAction="Stop" }
        if ($headers.Count) { $params["Headers"] = $headers }
        if ($jsonBody) { $params["Body"] = $jsonBody; $params["ContentType"] = "application/json" }
        $r = Invoke-RestMethod @params
        $j = ($r | ConvertTo-Json -Compress -Depth 2)
        $preview = if ($j.Length -gt 90) { $j.Substring(0,90) + "..." } else { $j }
        return [PSCustomObject]@{Status="OK"; Label=$label; Preview=$preview}
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $msg  = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message.Substring(0,[Math]::Min(80,$_.ErrorDetails.Message.Length)) } else { $_.Exception.Message.Substring(0,60) }
        return [PSCustomObject]@{Status="ERR"; Label=$label; Preview="HTTP $code | $msg"}
    }
}

# ============================================================
Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "APP 1 — DARKNEXUS :5000" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Yellow

$resp = Invoke-RestMethod "http://localhost:5000/api/auth/login" -Method POST -Body '{"email":"adjudan97one.ly@gmail.com","password":"LorenZ971972@"}' -ContentType "application/json" -TimeoutSec 5
$TK = $resp.access_token
Write-Host "✅ LOGIN JWT OK" -ForegroundColor Green

$dn = @(
    (T "Auth/me (profil user)" "http://localhost:5000/api/auth/me" "GET" $TK),
    (T "Status API" "http://localhost:5000/api/status" "GET" $TK),
    (T "Copilot health" "http://localhost:5000/api/copilot/health" "GET" $TK),
    (T "Copilot chat" "http://localhost:5000/api/copilot/chat" "POST" $TK '{"message":"test"}'),
    (T "Projects liste" "http://localhost:5000/api/projects" "GET" $TK),
    (T "Projects create" "http://localhost:5000/api/projects" "POST" $TK '{"name":"Test Auto","description":"test automatique suffisamment long","type":"web","features":[],"ai_model":"gpt-4"}'),
    (T "Projects templates Stripe" "http://localhost:5000/api/projects/templates/stripe" "GET" $TK),
    (T "Projects models AI" "http://localhost:5000/api/projects/models" "GET" $TK),
    (T "Projects analytics global" "http://localhost:5000/api/projects/analytics/global" "GET" $TK),
    (T "Assistant chat" "http://localhost:5000/api/assistant/chat" "POST" $TK '{"message":"Bonjour que peux-tu faire?","conversation_id":null}'),
    (T "Chat history (project vide)" "http://localhost:5000/api/chat/history/000000000000000000000000" "GET" $TK),
    (T "Chat voice-commands" "http://localhost:5000/api/chat/voice-commands" "GET" $TK),
    (T "Scraper test" "http://localhost:5000/api/scraper/test" "GET" $TK),
    (T "AI-assistant analyze" "http://localhost:5000/ai-assistant/analyze" "POST" $TK '{"url":"https://example.com"}'),
    (T "Streaming generate-project" "http://localhost:5000/api/streaming/generate-project" "POST" $TK '{"name":"test","type":"web","description":"test streaming project generation"}')
)

foreach ($t in $dn) {
    if ($t.Status -eq "OK") { Write-Host "  ✅ $($t.Label)" -ForegroundColor Green; Write-Host "     $($t.Preview)" -ForegroundColor DarkGray }
    else { Write-Host "  ❌ $($t.Label)" -ForegroundColor Red; Write-Host "     $($t.Preview)" -ForegroundColor DarkYellow }
}

# ============================================================
Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "APP 2 — ANALYTICS :5001" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Yellow

$an = @(
    (T "Root API" "http://localhost:5001/"),
    (T "Health" "http://localhost:5001/health"),
    (T "Dashboard overview" "http://localhost:5001/api/dashboard/overview"),
    (T "Lotteries analyze euromillions" "http://localhost:5001/api/lotteries/analyze/euromillions"),
    (T "Lotteries euromillions analysis" "http://localhost:5001/api/lotteries/euromillions/analysis"),
    (T "Lotteries loto analysis" "http://localhost:5001/api/lotteries/loto/analysis"),
    (T "Lotteries keno analysis" "http://localhost:5001/api/lotteries/keno/analysis"),
    (T "Lotteries grids euromillions" "http://localhost:5001/api/lotteries/grids/euromillions"),
    (T "Lotteries recommendations" "http://localhost:5001/api/lotteries/recommendations/euromillions"),
    (T "Lotteries results history" "http://localhost:5001/api/lotteries/results/history"),
    (T "Lotteries results latest" "http://localhost:5001/api/lotteries/results/latest"),
    (T "Lotteries statistics" "http://localhost:5001/api/lotteries/statistics/euromillions"),
    (T "Sports leagues" "http://localhost:5001/api/sports/leagues"),
    (T "Sports matches" "http://localhost:5001/api/sports/matches"),
    (T "Sports predict match" "http://localhost:5001/api/sports/matches/predict" "POST" $null '{"home_team":"PSG","away_team":"Lyon","league":"Ligue 1"}'),
    (T "Sports recommendations" "http://localhost:5001/api/sports/recommendations"),
    (T "Sports statistics" "http://localhost:5001/api/sports/statistics")
)

foreach ($t in $an) {
    if ($t.Status -eq "OK") { Write-Host "  ✅ $($t.Label)" -ForegroundColor Green; Write-Host "     $($t.Preview)" -ForegroundColor DarkGray }
    else { Write-Host "  ❌ $($t.Label)" -ForegroundColor Red; Write-Host "     $($t.Preview)" -ForegroundColor DarkYellow }
}

# ============================================================
Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "APP 3 — KILLAGAIN FOOD :5002" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Yellow

$kf = @(
    (T "Health" "http://localhost:5002/health"),
    (T "Stats" "http://localhost:5002/api/stats"),
    (T "History" "http://localhost:5002/api/history"),
    (T "Analyze ingredients" "http://localhost:5002/api/analyze-ingredients" "POST" $null '{"ingredients":["poulet","tomates","ail"],"diet":"none","servings":2}'),
    (T "Analyze photo (test vide)" "http://localhost:5002/api/analyze-photo" "POST" $null '{"image_base64":"test"}')
)

foreach ($t in $kf) {
    if ($t.Status -eq "OK") { Write-Host "  ✅ $($t.Label)" -ForegroundColor Green; Write-Host "     $($t.Preview)" -ForegroundColor DarkGray }
    else { Write-Host "  ❌ $($t.Label)" -ForegroundColor Red; Write-Host "     $($t.Preview)" -ForegroundColor DarkYellow }
}

# ============================================================
Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "APP 4 — WARZONE :5003" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Yellow

$wz = @(
    (T "Root API (liste endpoints)" "http://localhost:5003/api/"),
    (T "Weapons liste (102)" "http://localhost:5003/api/weapons"),
    (T "Stats globales" "http://localhost:5003/api/stats"),
    (T "Meta status" "http://localhost:5003/api/meta-status"),
    (T "Scripts liste" "http://localhost:5003/api/scripts"),
    (T "Build analytics report" "http://localhost:5003/api/build-analytics/report"),
    (T "Build analytics top builds" "http://localhost:5003/api/build-analytics/top-builds"),
    (T "Duo calculator best pairs" "http://localhost:5003/api/duo-calculator/best-pairs"),
    (T "Chat IA (message)" "http://localhost:5003/api/chat" "POST" $null '{"message":"Quelle est la meilleure arme meta?","session_id":"test-audit"}'),
    (T "Chat history session" "http://localhost:5003/api/chat/test-audit"),
    (T "Generate master script" "http://localhost:5003/api/generate-master-script" "POST" $null '{"weapon_id":"M4","playstyle":"aggressive"}'),
    (T "Generate ultimate script" "http://localhost:5003/api/generate-ultimate-script" "POST" $null '{"weapons":["M4"],"playstyle":"aggressive"}')
)

foreach ($t in $wz) {
    if ($t.Status -eq "OK") { Write-Host "  ✅ $($t.Label)" -ForegroundColor Green; Write-Host "     $($t.Preview)" -ForegroundColor DarkGray }
    else { Write-Host "  ❌ $($t.Label)" -ForegroundColor Red; Write-Host "     $($t.Preview)" -ForegroundColor DarkYellow }
}

Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "FIN DES TESTS" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Yellow

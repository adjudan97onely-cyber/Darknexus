# 🚀 SCRIPT DÉPLOIEMENT VERCEL + RENDER
# Exécute ce script pour déployer facilement

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 DÉPLOIEMENT: Analytics Lottery sur Vercel + Render    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Vérifier git
Write-Host "`n[1/5] ✅ Vérification Git..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé!" -ForegroundColor Red
    exit 1
}

# 2. Commit les changements
Write-Host "`n[2/5] 📝 Commit des modifications..." -ForegroundColor Yellow
cd c:\Darknexus-main
git add -A
git commit -m "🚀 Deploy to Vercel + Render - Production config"

Write-Host "✅ Changements committés" -ForegroundColor Green

# 3. Push vers GitHub
Write-Host "`n[3/5] 📤 Push vers GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Push effectué" -ForegroundColor Green

# 4. Afficher les URLs de déploiement
Write-Host "`n[4/5] 📋 URLs DE DÉPLOIEMENT:" -ForegroundColor Magenta

Write-Host "
╔════════════════════════════════════════════════════════════════╗
║  FRONTEND (à déployer sur Vercel)                             ║
╠════════════════════════════════════════════════════════════════╣
│                                                                │
│  1. Va à: https://vercel.com/dashboard                        │
│  2. Clique: "Add New" → "Project"                             │
│  3. Import: Darknexus (depuis GitHub)                         │
│  4. Configure:                                                 │
│     Root Directory: ./analytics-lottery/lottery/frontend       │
│     Build Command: npm run build                              │
│  5. Ajoute env var:                                            │
│     VITE_API_URL = https://analytics-lottery-backend.onrender.com
│  6. Clique: "Deploy"                                          │
│                                                                │
│  📍 Résultat: https://analytics-lottery.vercel.app            │
╚════════════════════════════════════════════════════════════════╝
" -ForegroundColor White

Write-Host "
╔════════════════════════════════════════════════════════════════╗
║  BACKEND (à déployer sur Render)                              ║
╠════════════════════════════════════════════════════════════════╣
│                                                                │
│  1. Va à: https://dashboard.render.com                        │
│  2. Clique: "New +" → "Web Service"                           │
│  3. Sélectionne: Darknexus (depuis GitHub)                    │
│  4. Configure:                                                 │
│     Name: analytics-lottery-backend                           │
│     Root Directory: ./analytics-lottery/lottery/backend        │
│     Build Command: pip install -r requirements.txt            │
│     Start Command: uvicorn main:app --host 0.0.0.0 --port 8080
│     Environment: python                                        │
│  5. Clique: "Deploy"                                          │
│                                                                │
│  📍 Résultat: https://analytics-lottery-backend.onrender.com  │
└════════════════════════════════════════════════════════════════┘
" -ForegroundColor White

# 5. Informations finales
Write-Host "`n[5/5] ✅ PRÊT À TESTER!" -ForegroundColor Green

Write-Host "
📱 ACCÈS DEPUIS TON TÉLÉPHONE (avec données mobiles):

    https://analytics-lottery.vercel.app

✨ C'est prêt! Plus besoin du WiFi local!
" -ForegroundColor Green

Write-Host "⏱️  Temps de déploiement: ~2-3 minutes par service" -ForegroundColor Cyan
Write-Host "📧 Les déploiements se font automatiquement quand tu push sur main" -ForegroundColor Cyan

Write-Host "`n💬 Questions? Regarde GUIDE_VERCEL_DEPLOY.md" -ForegroundColor Magenta

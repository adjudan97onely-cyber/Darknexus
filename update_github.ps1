# ============================================
# MISE À JOUR GITHUB - ADJ KILLAGAIN IA 2.0
# ============================================
# Script PowerShell pour Windows

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MISE À JOUR GITHUB" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Demander l'URL du repo
$repoUrl = Read-Host "Entre l'URL de ton repo GitHub"

# Vérifier si Git est installé
try {
    git --version | Out-Null
    Write-Host "Git trouvé !" -ForegroundColor Green
} catch {
    Write-Host "Git n'est pas installé !" -ForegroundColor Red
    Write-Host "Télécharge Git depuis : https://git-scm.com/" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""

# Initialiser Git si nécessaire
if (-not (Test-Path ".git")) {
    Write-Host "Initialisation du repo Git..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Configurer le remote
Write-Host "Configuration du remote GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl

# Ajouter tous les fichiers
Write-Host "Ajout de tous les fichiers..." -ForegroundColor Yellow
git add .

# Créer le commit
Write-Host "Création du commit..." -ForegroundColor Yellow
$commitMessage = @"
🚀 Update: ADJ KILLAGAIN IA 2.0 - Version complète

Fonctionnalités ajoutées:
- Générateur d'agents IA autonomes
- Conscience temporelle  
- Contrôleur d'agent (sécurité)
- Générateur PWA
- Web Scraper
- Animations avancées
- Création Express avec progression temps réel
- Voice commands
- User memory
- N8N generator
- Installation locale Windows
"@

git commit -m $commitMessage

# Push vers GitHub (force pour écraser)
Write-Host "Push vers GitHub..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  GITHUB MIS À JOUR !" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ton repo GitHub est maintenant à jour avec TOUTE la nouvelle app !" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu peux maintenant :" -ForegroundColor Cyan
Write-Host "  1. Aller sur ton PC" -ForegroundColor White
Write-Host "  2. git clone $repoUrl" -ForegroundColor White
Write-Host "  3. Lancer INSTALL_WINDOWS.ps1" -ForegroundColor White
Write-Host ""

pause

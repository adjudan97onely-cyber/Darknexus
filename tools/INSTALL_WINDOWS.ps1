# ============================================
# ADJ KILLAGAIN IA 2.0 - Installation Windows
# ============================================
# Script d'installation automatique
# Lance ce script en tant qu'Administrateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADJ KILLAGAIN IA 2.0 - INSTALLATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit être exécuté en tant qu'Administrateur !" -ForegroundColor Red
    Write-Host "Clic droit sur le script > Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    pause
    exit
}

# Variables
$installDir = "C:\ADJ_KILLAGAIN_IA"
$pythonVersion = "3.11"
$nodeVersion = "20"

Write-Host "Installation dans: $installDir" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. VÉRIFICATION PYTHON
# ============================================
Write-Host "[1/6] Vérification de Python..." -ForegroundColor Yellow

try {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $pythonVer = python --version 2>&1
        Write-Host "  Python trouvé: $pythonVer" -ForegroundColor Green
    } else {
        throw "Python non trouvé"
    }
} catch {
    Write-Host "  Python non installé. Installation en cours..." -ForegroundColor Yellow
    
    # Télécharger Python
    $pythonInstaller = "$env:TEMP\python-installer.exe"
    Write-Host "  Téléchargement de Python 3.11..."
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe" -OutFile $pythonInstaller
    
    # Installer Python
    Write-Host "  Installation de Python..."
    Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
    
    # Rafraîchir PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "  Python installé !" -ForegroundColor Green
}

# ============================================
# 2. VÉRIFICATION NODE.JS
# ============================================
Write-Host "[2/6] Vérification de Node.js..." -ForegroundColor Yellow

try {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeVer = node --version
        Write-Host "  Node.js trouvé: $nodeVer" -ForegroundColor Green
    } else {
        throw "Node.js non trouvé"
    }
} catch {
    Write-Host "  Node.js non installé. Installation en cours..." -ForegroundColor Yellow
    
    # Télécharger Node.js
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Write-Host "  Téléchargement de Node.js 20..."
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -OutFile $nodeInstaller
    
    # Installer Node.js
    Write-Host "  Installation de Node.js..."
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $nodeInstaller /quiet" -Wait
    
    # Rafraîchir PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "  Node.js installé !" -ForegroundColor Green
}

# Vérifier yarn
try {
    $yarnCmd = Get-Command yarn -ErrorAction SilentlyContinue
    if (-not $yarnCmd) {
        Write-Host "  Installation de Yarn..."
        npm install -g yarn
    }
    Write-Host "  Yarn installé !" -ForegroundColor Green
} catch {
    Write-Host "  Erreur lors de l'installation de Yarn" -ForegroundColor Red
}

# ============================================
# 3. VÉRIFICATION MONGODB
# ============================================
Write-Host "[3/6] Vérification de MongoDB..." -ForegroundColor Yellow

$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-Host "  MongoDB est en cours d'exécution !" -ForegroundColor Green
} else {
    Write-Host "  MongoDB n'est pas en cours d'exécution." -ForegroundColor Yellow
    Write-Host "  OPTION 1: Installe MongoDB Community (recommandé)" -ForegroundColor Cyan
    Write-Host "  OPTION 2: Utilise MongoDB Atlas (cloud gratuit)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Pour MongoDB Community: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "  Après installation, lance: net start MongoDB" -ForegroundColor Yellow
    Write-Host ""
    
    $useAtlas = Read-Host "Utiliser MongoDB Atlas (cloud) ? (o/n)"
    if ($useAtlas -eq "o" -or $useAtlas -eq "O") {
        Write-Host "  Parfait ! On utilisera MongoDB Atlas." -ForegroundColor Green
        $mongoUrl = Read-Host "  Entre ton URL MongoDB Atlas (mongodb+srv://...)"
    } else {
        Write-Host "  ATTENTION: MongoDB local requis pour continuer !" -ForegroundColor Red
        $mongoUrl = "mongodb://localhost:27017"
    }
}

if (-not $mongoUrl) {
    $mongoUrl = "mongodb://localhost:27017"
}

# ============================================
# 4. CLONAGE DU CODE
# ============================================
Write-Host "[4/6] Téléchargement du code..." -ForegroundColor Yellow

# Créer le dossier d'installation
if (Test-Path $installDir) {
    Write-Host "  Le dossier existe déjà. Utilisation du code existant." -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "  Dossier créé: $installDir" -ForegroundColor Green
}

Set-Location $installDir

# Note: Le code est déjà dans /app sur le container
# Pour l'installation locale, on copiera les fichiers nécessaires

# ============================================
# 5. INSTALLATION DES DÉPENDANCES
# ============================================
Write-Host "[5/6] Installation des dépendances..." -ForegroundColor Yellow

# Backend
if (Test-Path "$installDir\backend") {
    Write-Host "  Installation dépendances backend..."
    Set-Location "$installDir\backend"
    
    # Créer .env
    if (-not (Test-Path ".env")) {
        @"
MONGO_URL=$mongoUrl
DB_NAME=adj_killagain_ia
EMERGENT_LLM_KEY=votre-clé-api-ici
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "  Fichier .env créé !" -ForegroundColor Green
    }
    
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    Write-Host "  Backend OK !" -ForegroundColor Green
}

# Frontend
if (Test-Path "$installDir\frontend") {
    Write-Host "  Installation dépendances frontend..."
    Set-Location "$installDir\frontend"
    
    # Créer .env
    if (-not (Test-Path ".env")) {
        @"
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "  Fichier .env créé !" -ForegroundColor Green
    }
    
    yarn install
    Write-Host "  Frontend OK !" -ForegroundColor Green
}

# ============================================
# 6. CRÉATION DES SCRIPTS DE LANCEMENT
# ============================================
Write-Host "[6/6] Création des scripts de lancement..." -ForegroundColor Yellow

Set-Location $installDir

# Script pour lancer le backend
@"
@echo off
cd /d %~dp0backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
pause
"@ | Out-File -FilePath "start-backend.bat" -Encoding ASCII

# Script pour lancer le frontend
@"
@echo off
cd /d %~dp0frontend
yarn start
pause
"@ | Out-File -FilePath "start-frontend.bat" -Encoding ASCII

# Script pour lancer les deux
@"
@echo off
echo ========================================
echo   ADJ KILLAGAIN IA 2.0 - DEMARRAGE
echo ========================================
echo.
echo Demarrage du backend...
start cmd /k "%~dp0start-backend.bat"
timeout /t 5 /nobreak
echo.
echo Demarrage du frontend...
start cmd /k "%~dp0start-frontend.bat"
echo.
echo ========================================
echo   APPLICATION DEMARREE !
echo ========================================
echo.
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo.
echo Ouvre ton navigateur sur http://localhost:3000
echo.
pause
"@ | Out-File -FilePath "START.bat" -Encoding ASCII

Write-Host "  Scripts créés !" -ForegroundColor Green

# ============================================
# TERMINÉ !
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINÉE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour lancer l'application:" -ForegroundColor Cyan
Write-Host "  1. Double-clic sur START.bat" -ForegroundColor White
Write-Host "  2. Attends que les deux serveurs démarrent" -ForegroundColor White
Write-Host "  3. Ouvre http://localhost:3000 dans ton navigateur" -ForegroundColor White
Write-Host ""
Write-Host "Fichiers importants:" -ForegroundColor Cyan
Write-Host "  - backend\.env (configuration backend)" -ForegroundColor White
Write-Host "  - frontend\.env (configuration frontend)" -ForegroundColor White
Write-Host ""
Write-Host "En cas de problème:" -ForegroundColor Yellow
Write-Host "  - Vérifie que MongoDB est en cours d'exécution" -ForegroundColor White
Write-Host "  - Vérifie les fichiers .env" -ForegroundColor White
Write-Host "  - Lance start-backend.bat et start-frontend.bat séparément" -ForegroundColor White
Write-Host ""

pause

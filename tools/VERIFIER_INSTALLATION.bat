@echo off
chcp 65001 >nul
color 0E
cls
echo.
echo ========================================
echo   VERIFICATION DE L'INSTALLATION
echo ========================================
echo.
echo Ce script verifie que tout est bien installe
echo.
pause

echo.
echo [1] Verification de Python...
python --version
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe !
) else (
    echo OK: Python est installe
)
echo.

echo [2] Verification de Node.js...
node --version
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe !
) else (
    echo OK: Node.js est installe
)
echo.

echo [3] Verification de Yarn...
yarn --version
if errorlevel 1 (
    echo ERREUR: Yarn n'est pas installe !
) else (
    echo OK: Yarn est installe
)
echo.

echo [4] Verification du dossier backend...
if exist backend (
    echo OK: Dossier backend existe
    if exist backend\.env (
        echo OK: Fichier backend\.env existe
    ) else (
        echo ERREUR: Fichier backend\.env n'existe pas !
    )
    if exist backend\requirements.txt (
        echo OK: Fichier requirements.txt existe
    ) else (
        echo ERREUR: Fichier requirements.txt n'existe pas !
    )
) else (
    echo ERREUR: Dossier backend n'existe pas !
)
echo.

echo [5] Verification du dossier frontend...
if exist frontend (
    echo OK: Dossier frontend existe
    if exist frontend\.env (
        echo OK: Fichier frontend\.env existe
    ) else (
        echo ERREUR: Fichier frontend\.env n'existe pas !
    )
    if exist frontend\package.json (
        echo OK: Fichier package.json existe
    ) else (
        echo ERREUR: Fichier package.json n'existe pas !
    )
    if exist frontend\node_modules (
        echo OK: Dossier node_modules existe (dependances installees)
    ) else (
        echo ATTENTION: Dossier node_modules n'existe pas (yarn install pas encore fait)
    )
) else (
    echo ERREUR: Dossier frontend n'existe pas !
)
echo.

echo [6] Verification de MongoDB...
echo Essai de connexion a MongoDB...
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000); client.server_info(); print('OK: MongoDB est lance et accessible')" 2>nul
if errorlevel 1 (
    echo ATTENTION: MongoDB ne semble pas etre lance ou accessible
    echo Assure-toi de lancer MongoDB avant de demarrer l'app
) else (
    echo OK: MongoDB est lance et accessible
)
echo.

echo ========================================
echo   VERIFICATION TERMINEE
echo ========================================
echo.
echo Si tout est OK, tu peux lancer: LANCER_DARK_NEXUS.bat
echo.
pause

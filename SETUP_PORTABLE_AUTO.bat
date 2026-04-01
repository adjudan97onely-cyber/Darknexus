@echo off
REM Setup Automatise Darknexus - PC Portable
REM Ce script clone le repo et setup tout automatiquement

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  SETUP DARKNEXUS - PC PORTABLE
echo ========================================
echo.

REM Demande le chemin de destination
set /p INSTALL_PATH="Ou veux-tu installer Darknexus? (ex: C:\ ou D:\): "

echo.
echo [1/5] Clonage du repo...
cd /d "%INSTALL_PATH%"
git clone https://github.com/adjudan97onely-cyber/Darknexus.git
cd Darknexus

if errorlevel 1 (
    echo ERREUR: Le clone a echoue. Verifie que Git est installe.
    pause
    exit /b 1
)

echo [OK] Repo clone!
echo.

REM Backend setup
echo [2/5] Setup Backend Principal...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ATTENTION: Erreur installation backend. Continue quand meme...
)
call venv\Scripts\deactivate.bat
cd ..
echo [OK] Backend setup!
echo.

REM Frontend setup
echo [3/5] Setup Frontend Principal...
cd frontend
call npm install
if errorlevel 1 (
    echo ATTENTION: Erreur npm install frontend. Continue quand meme...
)
cd ..
echo [OK] Frontend setup!
echo.

REM Warzone Backend
echo [4/5] Setup Warzone Backend...
cd warzone\backend
python -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install fastapi uvicorn motor python-dotenv openai
if errorlevel 1 (
    echo ATTENTION: Erreur installation Warzone backend.
)
call venv\Scripts\deactivate.bat
cd ..\..
echo [OK] Warzone Backend setup!
echo.

REM Warzone Frontend
echo [5/5] Setup Warzone Frontend...
cd warzone\frontend
call npm install
if errorlevel 1 (
    echo ATTENTION: Erreur npm install Warzone.
)
cd ..\..
echo [OK] Warzone Frontend setup!
echo.

echo.
echo ========================================
echo  SETUP TERMINE!
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Copie les fichiers .env du PC bureau vers:
echo    - backend\.env
echo    - frontend\.env.local
echo    - warzone\backend\.env
echo    - warzone\frontend\.env.local
echo.
echo 2. Lance les apps avec les batch scripts:
echo    - LANCER_LOTTERY.bat
echo    - LANCER_WARZONE.bat
echo    - LANCER_KILLAGAIN_FOOD.bat
echo.
echo 3. Ou consulte SETUP_PC_PORTABLE.md pour demarrage manual
echo.
pause

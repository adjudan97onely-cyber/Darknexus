@echo off
REM =====================================================
REM LANCER ANALYTICS-LOTTERY - Ligue 1 Predictions
REM =====================================================

echo.
echo ╔═════════════════════════════════════════╗
echo ║    ANALYTICS-LOTTERY (Ligue 1)          ║
echo ║    Real-time Predictions + Odds         ║
echo ╚═════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trouvé. Veuillez installer Python 3.14+
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non trouvé. Veuillez installer Node.js
    pause
    exit /b 1
)

echo ✅ Dépendances OK
echo.
echo Démarrage de l'application...
echo.

REM Start backend in background
cd backend
echo Démarrage du backend (port 5000)...
start "Backend - Analytics" python server.py
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start frontend dev server
cd frontend
echo Démarrage du frontend (port 5173)...
start "Frontend - Analytics" cmd /k "timeout /t 4 /nobreak >nul 2>&1 && start http://localhost:5173 && npm run dev"
cd ..

echo.
echo ╔═════════════════════════════════════════╗
echo ║  Application démarrée!                  ║
echo ║                                         ║
echo ║  Backend:  http://localhost:5000       ║
echo ║  Frontend: http://localhost:5173       ║
echo ║                                         ║
echo ║  Prédictions Ligue 1 disponibles!      ║
echo ╚═════════════════════════════════════════╝
echo.
pause

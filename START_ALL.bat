@echo off
setlocal
echo.
echo 🧹 Nettoyage des anciens process...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo ✅ Clean terminé !
echo.
cd /d "%~dp0"
set "PYTHON=%~dp0_publish\Darknexus-full\analytics-lottery\backend\venv\Scripts\python.exe"

echo.
echo ============================================================
echo   DARKNEXUS - Menu principal
echo ============================================================
echo.
echo   [1] Darknexus principal   (backend 5000 / frontend 3000)
echo   [2] Analytics             (backend 5001 / frontend 5173)
echo   [3] Warzone               (backend 5003 / frontend 3001)
echo   [4] Killagain Food        (backend 5002 / frontend 5180)
echo   [5] Lancer TOUT
echo   [6] Arreter TOUT
echo   [0] Quitter
echo.
set /p CHOIX=Ton choix: 

if "%CHOIX%"=="1" goto :darknexus
if "%CHOIX%"=="2" goto :analytics
if "%CHOIX%"=="3" goto :warzone
if "%CHOIX%"=="4" goto :food
if "%CHOIX%"=="5" goto :all
if "%CHOIX%"=="6" goto :stop
if "%CHOIX%"=="0" exit /b 0

echo Choix invalide.
pause
exit /b 1

:darknexus
start "Darknexus Backend" cmd /k "cd /d ""%~dp0backend"" && ""%PYTHON%"" server.py"
timeout /t 3 /nobreak >nul
start "Darknexus Frontend" cmd /k "cd /d ""%~dp0frontend"" && set REACT_APP_BACKEND_URL=http://localhost:5000 && set BROWSER=none && npm start"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
exit /b 0

:analytics
start "Analytics Backend" cmd /k "cd /d ""%~dp0analytics\backend"" && ""%PYTHON%"" -m uvicorn main:app --host 0.0.0.0 --port 5001"
timeout /t 3 /nobreak >nul
start "Analytics Frontend" cmd /k "cd /d ""%~dp0analytics\frontend"" && set VITE_API_URL=http://localhost:5001 && npm run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
exit /b 0

:warzone
start "Warzone Backend" cmd /k "cd /d ""%~dp0warzone\backend"" && ""%PYTHON%"" -m uvicorn server:app --host 0.0.0.0 --port 5003"
timeout /t 3 /nobreak >nul
start "Warzone Frontend" cmd /k "cd /d ""%~dp0warzone\frontend"" && set REACT_APP_BACKEND_URL=http://localhost:5003 && set PORT=3001 && set BROWSER=none && npm start"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3001"
exit /b 0

:food
start "Killagain Food Backend" cmd /k "cd /d ""%~dp0killagain-food\backend 2"" && ""%PYTHON%"" start_simple.py"
timeout /t 3 /nobreak >nul
start "Killagain Food Frontend" cmd /k "cd /d ""%~dp0killagain-food"" && npm run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5180"
exit /b 0

:all
echo Demarrage de tous les backends...
start "Darknexus Backend"     cmd /k "cd /d ""%~dp0backend""             && ""%PYTHON%"" server.py"
start "Analytics Backend"     cmd /k "cd /d ""%~dp0analytics\backend""   && ""%PYTHON%"" -m uvicorn main:app --host 0.0.0.0 --port 5001"
start "Warzone Backend"       cmd /k "cd /d ""%~dp0warzone\backend""      && ""%PYTHON%"" -m uvicorn server:app --host 0.0.0.0 --port 5003"
start "Killagain Backend"     cmd /k "cd /d ""%~dp0killagain-food\backend 2"" && ""%PYTHON%"" start_simple.py"
echo Attente 6 secondes...
timeout /t 6 /nobreak >nul
echo Demarrage de tous les frontends...
start "Darknexus Frontend"    cmd /k "cd /d ""%~dp0frontend""             && set REACT_APP_BACKEND_URL=http://localhost:5000 && set BROWSER=none && npm start"
start "Analytics Frontend"    cmd /k "cd /d ""%~dp0analytics\frontend""   && set VITE_API_URL=http://localhost:5001 && npm run dev"
start "Warzone Frontend"      cmd /k "cd /d ""%~dp0warzone\frontend""      && set REACT_APP_BACKEND_URL=http://localhost:5003 && set PORT=3001 && set BROWSER=none && npm start"
start "Killagain Frontend"    cmd /k "cd /d ""%~dp0killagain-food"" && npm run dev"
echo Attente 10 secondes avant ouverture des navigateurs...
timeout /t 10 /nobreak >nul
start "" "http://localhost:3000"
start "" "http://localhost:5173"
start "" "http://localhost:3001"
start "" "http://localhost:5180"
exit /b 0

:stop
echo Arret de tous les processus Python et Node...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Tout arrete.
pause
exit /b 0

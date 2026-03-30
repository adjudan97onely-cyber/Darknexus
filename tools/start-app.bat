@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo =========================================
echo   Killagain Food - Demarrage rapide
echo =========================================

echo [1/3] Verification node_modules...
if not exist "node_modules" (
  echo Installation des dependances...
  call npm install
  if errorlevel 1 (
    echo Echec npm install
    pause
    exit /b 1
  )
)

echo [2/3] Lancement du serveur Vite...
start "Killagain Food Dev Server" cmd /k "cd /d %~dp0 && npm run dev"

echo [3/3] Attente serveur puis ouverture navigateur...
set READY=
for /L %%i in (1,1,40) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:5180' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if !errorlevel! EQU 0 (
    set READY=1
    goto :open
  )
  timeout /t 1 /nobreak >nul
)

:open
if defined READY (
  start "" "http://127.0.0.1:5180"
  echo Application ouverte: http://127.0.0.1:5180
) else (
  echo Serveur non detecte a temps. Ouvre manuellement http://127.0.0.1:5180
)

endlocal

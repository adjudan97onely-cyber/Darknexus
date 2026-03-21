@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0\.."

echo =========================================
echo   Killagain Food - Mobile Production Test
echo =========================================

echo [1/5] Verification dependances...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo Echec npm install
    pause
    exit /b 1
  )
)

echo [2/5] Build production...
call npm run build
if errorlevel 1 (
  echo Echec build
  pause
  exit /b 1
)

echo [3/5] Detection IP locale...
set LOCAL_IP=NOT_FOUND
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"Adresse IPv4"') do (
  if "!LOCAL_IP!"=="NOT_FOUND" (
    set LOCAL_IP=%%I
    set LOCAL_IP=!LOCAL_IP: =!
  )
)

echo [4/5] Lancement serveur preview (accessible mobile)...
start "Killagain Food Preview" cmd /k "cd /d %~dp0\.. && npm run preview -- --host 0.0.0.0 --port 5181"

echo [5/5] Verification disponibilité...
set READY=
for /L %%i in (1,1,50) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:5181' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if !errorlevel! EQU 0 (
    set READY=1
    goto :done
  )
  timeout /t 1 /nobreak >nul
)

:done
if defined READY (
  echo.
  echo URL PC      : http://127.0.0.1:5181
  if not "!LOCAL_IP!"=="NOT_FOUND" (
    echo URL Mobile  : http://!LOCAL_IP!:5181
  )
  echo.
  echo Tu peux installer la PWA depuis le mobile - Ajouter a l'ecran d'accueil
  start "" "http://127.0.0.1:5181"
) else (
  echo Serveur preview non detecte.
)

endlocal

@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo =========================================
echo   Killagain Food - Mode Mobile (Wi-Fi)
echo =========================================

echo [1/4] Verification node_modules...
if not exist "node_modules" (
  echo Installation des dependances...
  call npm install
  if errorlevel 1 (
    echo Echec npm install
    pause
    exit /b 1
  )
)

echo [2/4] Detection IP locale...
for /f "delims=" %%I in ('powershell -NoProfile -Command "$ip=(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -notlike ''169.254*'' -and $_.IPAddress -ne ''127.0.0.1''} ^| Select-Object -First 1 -ExpandProperty IPAddress); if($ip){$ip}else{''NOT_FOUND''}"') do set LOCAL_IP=%%I

if "%LOCAL_IP%"=="NOT_FOUND" (
  echo Impossible de detecter l IP locale automatiquement.
  echo Utilise ipconfig pour trouver ton IPv4.
)

echo [3/4] Lancement serveur Vite en mode mobile...
start "Killagain Food Mobile Dev Server" cmd /k "cd /d %~dp0 && npm run dev:mobile"

echo [4/4] Attente serveur...
set READY=
for /L %%i in (1,1,50) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:5180' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if !errorlevel! EQU 0 (
    set READY=1
    goto :done
  )
  timeout /t 1 /nobreak >nul
)

:done
if defined READY (
  echo.
  echo =========================================
  echo Serveur pret
  echo =========================================
  echo PC local    : http://127.0.0.1:5180
  if not "%LOCAL_IP%"=="NOT_FOUND" (
    echo Mobile Wi-Fi: http://%LOCAL_IP%:5180
  )
  echo.
  echo IMPORTANT: ton telephone doit etre sur le MEME Wi-Fi que ce PC.
  start "" "http://127.0.0.1:5180"
) else (
  echo Serveur non detecte a temps. Verifie la fenetre du serveur.
)

endlocal

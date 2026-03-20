@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0\..\frontend"

echo =========================================
echo   Analytics Lottery - Mobile Production Test
echo =========================================

if not exist "node_modules" (
  call npm install
  if errorlevel 1 exit /b 1
)

call npm run build
if errorlevel 1 exit /b 1

set LOCAL_IP=NOT_FOUND
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"Adresse IPv4"') do (
  if "!LOCAL_IP!"=="NOT_FOUND" (
    set LOCAL_IP=%%I
    set LOCAL_IP=!LOCAL_IP: =!
  )
)

start "Analytics Lottery Preview" cmd /k "cd /d %~dp0\..\frontend && npm run preview -- --host 0.0.0.0 --port 5176"

echo URL PC      : http://127.0.0.1:5176
if not "!LOCAL_IP!"=="NOT_FOUND" echo URL Mobile  : http://!LOCAL_IP!:5176

echo Installer ensuite la PWA depuis le navigateur mobile.
endlocal

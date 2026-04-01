@echo off
cd /d "%~dp0"
call ".\killagain-food\START.bat"

echo Démarrage npm run dev...
npm run dev
pause

@echo off
setlocal
cd /d "%~dp0"
call ".\start_backend.bat"
timeout /t 3 /nobreak >nul
call ".\start_frontend.bat"
exit /b 0
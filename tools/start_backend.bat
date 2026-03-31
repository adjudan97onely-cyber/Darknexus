@echo off
echo ========================================
echo   DEMARRAGE BACKEND
echo ========================================
setlocal
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%analytics-lottery\backend"
set "PYTHON=python"

if not exist "%BACKEND_DIR%\server.py" (
	echo [ERROR] Backend introuvable: %BACKEND_DIR%
	exit /b 1
)

cd /d %BACKEND_DIR%
%PYTHON% server.py

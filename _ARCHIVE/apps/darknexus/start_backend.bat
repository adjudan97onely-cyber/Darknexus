@echo off
echo ========================================
echo   DEMARRAGE BACKEND
echo ========================================
setlocal
set BACKEND_DIR=C:\Darknexus-main\analytics-lottery\backend
set PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe
cd /d %BACKEND_DIR%
"%PYTHON%" start_simple.py

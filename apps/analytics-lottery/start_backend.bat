@echo off
REM =====================================================
REM START BACKEND - Analytics Lottery
REM =====================================================

echo.
echo ╔═════════════════════════════════════════╗
echo ║    Backend - Analytics Lottery          ║
echo ║    Port 5000 - FastAPI + TinyDB         ║
echo ╚═════════════════════════════════════════╝
echo.

cd backend
python server.py
pause

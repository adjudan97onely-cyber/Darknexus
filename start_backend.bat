@echo off
echo ========================================
echo   DEMARRAGE BACKEND
echo ========================================
cd backend
call venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

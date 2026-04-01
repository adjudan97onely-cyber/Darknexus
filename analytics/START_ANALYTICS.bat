@echo off
title Analytics Lottery - Serveur
echo ==========================================
echo  ANALYTICS LOTTERY - Demarrage serveur
echo ==========================================
echo.
echo Le serveur demarre sur http://localhost:5001
echo NE PAS FERMER CETTE FENETRE
echo.
cd /d C:\Darknexus-main\analytics\backend
python server.py
pause

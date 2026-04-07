@echo off
title Chronus Zen IDE — Lancement
cd /d "%~dp0ui"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        CHRONUS ZEN IDE               ║
echo  ╚══════════════════════════════════════╝
echo.

:: Vider le cache electron-vite
echo [1/2] Nettoyage du cache...
if exist "node_modules\.cache"           rmdir /s /q "node_modules\.cache"
if exist ".vite"                         rmdir /s /q ".vite"
if exist "out"                           rmdir /s /q "out"
echo      Cache vide.

echo.
echo [2/2] Lancement de l'application...
echo.

npm run dev

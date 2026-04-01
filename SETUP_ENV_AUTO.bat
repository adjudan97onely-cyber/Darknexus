@echo off
REM ═══════════════════════════════════════════════════════════
REM  SETUP ENV AUTOMATIQUE - Détecte le PC et configure
REM ═══════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo  ⚙️  CONFIGURATION AUTOMATIQUE - Détection PC
echo ════════════════════════════════════════════════════════════
echo.

REM Détecte le PC courant
set COMPUTERNAME_LOWER=%COMPUTERNAME%

echo 🖥️  PC détecté: %COMPUTERNAME%
echo.

REM PC BUREAU
if "%COMPUTERNAME_LOWER%"=="DESKTOP-AL96PS2" (
    echo ✅ PC BUREAU détecté!
    echo Création des fichiers .env pour le PC Bureau...
    echo.
    
    REM KILLAGAIN-FOOD
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=dark_nexus_local
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > "killagain-food\.env"
    echo   ✓ killagain-food/.env créé
    
    REM WARZONE-DEV
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=warzone_dev
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
        echo PORT=5002
        echo NODE_ENV=development
    ) > "projects\warzone-DEV\backend\.env"
    echo   ✓ projects/warzone-DEV/backend/.env créé
    
    (
        echo VITE_API_URL=http://localhost:5002
    ) > "projects\warzone-DEV\frontend\.env.local"
    echo   ✓ projects/warzone-DEV/frontend/.env.local créé
    
    REM ANALYTICS-LOTTERY
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=analytics_lottery
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
        echo PORT=5001
    ) > "projects\analytics-lottery\backend\.env"
    echo   ✓ projects/analytics-lottery/backend/.env créé
    
    (
        echo VITE_API_URL=http://localhost:5001
    ) > "projects\analytics-lottery\frontend\.env.local"
    echo   ✓ projects/analytics-lottery/frontend/.env.local créé
    
    goto :done
)

REM PC PORTABLE
if "%COMPUTERNAME_LOWER%"=="DESKTOP-PG9OU8" (
    echo ✅ PC PORTABLE détecté!
    echo Création des fichiers .env pour le PC Portable...
    echo.
    
    REM KILLAGAIN-FOOD
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=dark_nexus_local
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > "killagain-food\.env"
    echo   ✓ killagain-food/.env créé
    
    REM WARZONE-DEV
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=warzone_dev
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
        echo PORT=5002
        echo NODE_ENV=development
    ) > "projects\warzone-DEV\backend\.env"
    echo   ✓ projects/warzone-DEV/backend/.env créé
    
    (
        echo VITE_API_URL=http://localhost:5002
    ) > "projects\warzone-DEV\frontend\.env.local"
    echo   ✓ projects/warzone-DEV/frontend/.env.local créé
    
    REM ANALYTICS-LOTTERY
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=analytics_lottery
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
        echo PORT=5001
    ) > "projects\analytics-lottery\backend\.env"
    echo   ✓ projects/analytics-lottery/backend/.env créé
    
    (
        echo VITE_API_URL=http://localhost:5001
    ) > "projects\analytics-lottery\frontend\.env.local"
    echo   ✓ projects/analytics-lottery/frontend/.env.local créé
    
    goto :done
)

REM PC INCONNU
echo ❌ PC inconnu: %COMPUTERNAME%
echo.
echo Tu dois ajouter ta configuration! Edite ce fichier et ajoute:
echo.
echo   if "!COMPUTERNAME_LOWER!"=="TON_PC" (
echo       REM Ajoute tes fichiers .env ici
echo   )
echo.
pause
exit /b 1

:done
echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Configuration terminée!
echo ════════════════════════════════════════════════════════════
echo.
echo Les fichiers .env ont été créés avec succès.
echo Tu peux maintenant lancer tes apps avec START_ALL.bat
echo.
pause
endlocal

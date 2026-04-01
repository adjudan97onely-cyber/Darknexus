@echo off
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo  ⚙️  CONFIGURATION AUTOMATIQUE - Détection PC
echo ════════════════════════════════════════════════════════════
echo.

set COMPUTERNAME_LOWER=%COMPUTERNAME%
echo 🖥️  PC détecté: %COMPUTERNAME%
echo.

if "%COMPUTERNAME_LOWER%"=="DESKTOP-AL96PS2" (
    echo ✅ PC BUREAU détecté!
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=dark_nexus_local
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > killagain-food\.env
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=warzone_dev
        echo PORT=5002
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > projects\warzone-DEV\backend\.env
    (
        echo VITE_API_URL=http://localhost:5002
    ) > projects\warzone-DEV\frontend\.env
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=analytics_lottery
        echo PORT=5001
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > projects\analytics-lottery\backend\.env
    (
        echo VITE_API_URL=http://localhost:5001
    ) > projects\analytics-lottery\frontend\.env
    goto :done
)

if "%COMPUTERNAME_LOWER%"=="DESKTOP-PG9OUJ8" (
    echo ✅ PC PORTABLE détecté!
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=dark_nexus_local
        echo CORS_ORIGINS=*
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > killagain-food\.env
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=warzone_dev
        echo PORT=5002
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > projects\warzone-DEV\backend\.env
    (
        echo VITE_API_URL=http://localhost:5002
    ) > projects\warzone-DEV\frontend\.env
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=analytics_lottery
        echo PORT=5001
        echo OPENAI_API_KEY=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
        echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
    ) > projects\analytics-lottery\backend\.env
    (
        echo VITE_API_URL=http://localhost:5001
    ) > projects\analytics-lottery\frontend\.env
    goto :done
)

echo ❌ PC inconnu: %COMPUTERNAME%
exit /b 1

:done
echo ✅ Configuration terminée - Tous les .env créés!
pause
endlocal

@echo off
cls
echo.
echo ========================================
echo    OPEN APP WITH NO CACHE
echo ========================================
echo.
echo Opening Chrome in Incognito mode...
echo This will show the updated icon sizes!
echo.
echo ========================================
echo.

timeout /t 1 /nobreak >nul

REM Try to open in Chrome Incognito
start chrome --incognito http://localhost:3000

echo.
echo If Chrome didn't open, manually:
echo 1. Press Ctrl + Shift + N (Incognito)
echo 2. Go to: http://localhost:3000
echo.
echo You'll see the larger icons immediately!
echo.
pause

@echo off
cls
echo.
echo ========================================
echo    OPENING APP ON CORRECT PORT
echo ========================================
echo.
echo Your app runs on PORT 3001, not 3000!
echo.
echo Opening: http://localhost:3001
echo.
echo ========================================
echo.

timeout /t 2 /nobreak >nul

start chrome --incognito http://localhost:3001

echo.
echo If Chrome didn't open:
echo 1. Open browser
echo 2. Go to: http://localhost:3001
echo 3. Press Ctrl + Shift + R
echo.
echo YOU MUST USE PORT 3001!
echo.
pause

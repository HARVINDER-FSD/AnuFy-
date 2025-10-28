@echo off
cls
color 0A
echo.
echo ========================================
echo         OPEN FRESH APP
echo ========================================
echo.
echo Opening: http://localhost:3000
echo.
echo This will open in Incognito mode
echo to avoid any cached content.
echo.
echo ========================================
echo.

timeout /t 2 /nobreak >nul

start chrome --incognito --new-window http://localhost:3000

echo.
echo ✓ Browser opened!
echo.
echo If you don't see changes:
echo 1. Press Ctrl + Shift + R (hard refresh)
echo 2. Or close and reopen this file
echo.
echo ========================================
echo.
pause

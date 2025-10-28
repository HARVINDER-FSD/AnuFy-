@echo off
cls
echo.
echo ========================================
echo    CLEAR CACHE AND SEE ICON CHANGES
echo ========================================
echo.
echo Opening cache clear page...
echo.
echo This will:
echo  - Clear all browser caches
echo  - Clear service workers
echo  - Show you the updated icons
echo.
echo ========================================
echo.

timeout /t 2 /nobreak >nul

start http://localhost:3000/refresh.html

echo.
echo Done! Your browser will refresh automatically.
echo.
echo Close this window after the browser opens.
echo.
pause

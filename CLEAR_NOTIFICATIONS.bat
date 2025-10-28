@echo off
cls
echo.
echo ========================================
echo    CLEAR ALL NOTIFICATIONS
echo ========================================
echo.
echo This will delete ALL notifications
echo from your database.
echo.
echo This fixes:
echo  - Can't fetch notifications
echo  - Badge not updating
echo  - Icon not clickable
echo.
echo ========================================
echo.

timeout /t 2 /nobreak >nul

start http://localhost:3000/clear-notifications.html

echo.
echo Opening clear notifications page...
echo.
echo Click the button to delete all notifications.
echo.
pause

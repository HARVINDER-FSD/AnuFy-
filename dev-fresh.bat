@echo off
echo ========================================
echo  FRESH START - Clearing All Caches
echo ========================================
echo.

echo [1/5] Stopping servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Clearing Next.js cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo [3/5] Clearing API server cache...
if exist api-server\.next rmdir /s /q api-server\.next
if exist api-server\node_modules\.cache rmdir /s /q api-server\node_modules\.cache

echo [4/5] Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [5/5] Starting API server...
start "API Server" cmd /k "cd api-server && npm run dev"

echo.
echo ========================================
echo  DONE! Servers starting fresh...
echo ========================================
echo.
echo Frontend: http://localhost:3001
echo API: http://localhost:5000
echo.
echo Press Ctrl+C in each terminal to stop
echo ========================================
pause

@echo off
echo ========================================
echo Complete Webpack Error Fix
echo ========================================
echo.

echo Step 1: Cleaning old files...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist .swc rmdir /s /q .swc
if exist package-lock.json del /f /q package-lock.json
echo ✓ Cleaned

echo.
echo Step 2: Installing dependencies...
call npm install
echo ✓ Installed

echo.
echo Step 3: Starting dev server...
call npm run dev

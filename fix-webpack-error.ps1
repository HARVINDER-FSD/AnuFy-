Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Webpack Error Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Cleaning old files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules,.next,.swc,package-lock.json -ErrorAction SilentlyContinue
Write-Host "✓ Cleaned" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✓ Installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Starting dev server..." -ForegroundColor Yellow
npm run dev

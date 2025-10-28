Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FRESH START - Clearing All Caches" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/5] Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }

Write-Host "[3/5] Clearing API server cache..." -ForegroundColor Yellow
if (Test-Path api-server\.next) { Remove-Item -Recurse -Force api-server\.next }
if (Test-Path api-server\node_modules\.cache) { Remove-Item -Recurse -Force api-server\node_modules\.cache }

Write-Host "[4/5] Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3

Write-Host "[5/5] Starting API server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-server; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " DONE! Servers starting fresh..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "API: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

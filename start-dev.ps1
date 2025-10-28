# Start both frontend and backend servers

Write-Host "Starting Anufy Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Start API Server in background
Write-Host "1. Starting API Server (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-server; npm run dev" -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "2. Starting Frontend (port 3000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Servers starting..." -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the frontend server" -ForegroundColor Yellow
Write-Host ""

npm run dev

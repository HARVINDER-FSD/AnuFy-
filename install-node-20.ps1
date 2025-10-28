Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Node.js 20 LTS Installation Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current Node version
$nodeVersion = node --version
Write-Host "Current Node.js version: $nodeVersion" -ForegroundColor Yellow
Write-Host ""

if ($nodeVersion -like "v20.*") {
    Write-Host "✓ You already have Node 20 installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cleaning and reinstalling dependencies..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules,package-lock.json,.next -ErrorAction SilentlyContinue
    npm install
    Write-Host ""
    Write-Host "✓ Done! Run 'npm run dev' to start your app." -ForegroundColor Green
    exit
}

Write-Host "⚠ You need to install Node.js 20 LTS" -ForegroundColor Red
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host "1. Install using NVM for Windows (Recommended)" -ForegroundColor White
Write-Host "2. Download Node 20 LTS directly" -ForegroundColor White
Write-Host "3. Exit and install manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Opening NVM for Windows download page..." -ForegroundColor Yellow
        Start-Process "https://github.com/coreybutler/nvm-windows/releases"
        Write-Host ""
        Write-Host "After installing NVM, run these commands:" -ForegroundColor Cyan
        Write-Host "  nvm install 20.18.0" -ForegroundColor White
        Write-Host "  nvm use 20.18.0" -ForegroundColor White
        Write-Host "  npm install" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "Opening Node.js download page..." -ForegroundColor Yellow
        Start-Process "https://nodejs.org/en/download"
        Write-Host ""
        Write-Host "Download and install Node.js 20.18.0 LTS" -ForegroundColor Cyan
        Write-Host "Then run these commands:" -ForegroundColor Cyan
        Write-Host "  npm install" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
    }
    "3" {
        Write-Host ""
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        Write-Host "Read INSTALL_NODE_20.md for manual instructions." -ForegroundColor Cyan
    }
    default {
        Write-Host ""
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

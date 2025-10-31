# Cleanup Old Files Script
# Removes old master folder after creating backup

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Old Files Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if master folder exists
if (-not (Test-Path "master")) {
    Write-Host "✅ Old master folder already removed!" -ForegroundColor Green
    exit 0
}

Write-Host "📁 Found old master folder" -ForegroundColor Yellow
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to create a backup before removing? (Y/n)"
if ($confirmation -ne 'n' -and $confirmation -ne 'N') {
    Write-Host "`n📦 Creating backup..." -ForegroundColor Cyan
    Copy-Item -Path master -Destination master_backup -Recurse
    Write-Host "✅ Backup created: master_backup/" -ForegroundColor Green
}

Write-Host "`n🧪 Testing build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    
    $remove = Read-Host "`nRemove old master folder? (Y/n)"
    if ($remove -ne 'n' -and $remove -ne 'N') {
        Write-Host "`n🗑️  Removing old master folder..." -ForegroundColor Yellow
        Remove-Item -Path master -Recurse -Force
        Write-Host "✅ Old master folder removed!" -ForegroundColor Green
        
        Write-Host "`n📚 Removing old documentation..." -ForegroundColor Yellow
        Remove-Item -Path "MASTER_*.md" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "START_HERE_MASTER_SYSTEM.md" -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Old documentation removed!" -ForegroundColor Green
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "   Cleanup Complete! ✅" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "`nYour app is now using the new architecture!" -ForegroundColor White
        Write-Host "Backup available at: master_backup/" -ForegroundColor Gray
    } else {
        Write-Host "`n⏭️  Skipped removal. Old files kept." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Build failed! Keeping old files for safety." -ForegroundColor Red
    Write-Host "Please fix build errors before removing old files." -ForegroundColor Yellow
}

Write-Host ""

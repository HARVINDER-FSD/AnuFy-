# PowerShell script to fix JWT_SECRET across all files
$oldSecret = "jnnkdajjsnfknaskfn"
$newSecret = "4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192"

Write-Host "Fixing JWT_SECRET in all files..." -ForegroundColor Yellow

# Get all TypeScript files
$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" }

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match $oldSecret) {
        $newContent = $content -replace [regex]::Escape($oldSecret), $newSecret
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`nTotal files fixed: $count" -ForegroundColor Cyan
Write-Host "JWT_SECRET has been updated across the entire codebase!" -ForegroundColor Green
Write-Host "`nNow restart both servers:" -ForegroundColor Yellow
Write-Host "1. Stop both servers (Ctrl+C)" -ForegroundColor White
Write-Host "2. In api-server folder: npm run dev" -ForegroundColor White
Write-Host "3. In main folder: npm run dev" -ForegroundColor White
Write-Host "4. Clear cookies and login again" -ForegroundColor White

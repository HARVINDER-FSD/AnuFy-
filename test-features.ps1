# Feature Testing Script
# Automated checks for app functionality

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🧪 FEATURE TESTING SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if app is running
Write-Host "1. Checking if app is running..." -ForegroundColor Yellow
$response = $null
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ App is running!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ App is not running!" -ForegroundColor Red
    Write-Host "   Start the app with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Testing API endpoints..." -ForegroundColor Yellow

# Test API endpoints
$endpoints = @(
    "/api/posts",
    "/api/reels",
    "/api/stories",
    "/api/users",
    "/api/notifications",
    "/api/search"
)

$passedTests = 0
$failedTests = 0

foreach ($endpoint in $endpoints) {
    try {
        $testResponse = Invoke-WebRequest -Uri "http://localhost:3001$endpoint" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($testResponse.StatusCode -eq 200 -or $testResponse.StatusCode -eq 401) {
            Write-Host "   ✅ $endpoint" -ForegroundColor Green
            $passedTests++
        }
    } catch {
        Write-Host "   ❌ $endpoint - $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host "`n3. Testing pages..." -ForegroundColor Yellow

$pages = @(
    "/",
    "/feed",
    "/explore",
    "/reels",
    "/search",
    "/notifications",
    "/messages",
    "/profile",
    "/create",
    "/settings"
)

foreach ($page in $pages) {
    try {
        $pageResponse = Invoke-WebRequest -Uri "http://localhost:3001$page" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($pageResponse.StatusCode -eq 200) {
            Write-Host "   ✅ $page" -ForegroundColor Green
            $passedTests++
        }
    } catch {
        Write-Host "   ❌ $page - $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "   ❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failedTests -eq 0) {
    Write-Host "🎉 All automated tests passed!" -ForegroundColor Green
    Write-Host "`nNext: Manual testing" -ForegroundColor Yellow
    Write-Host "Read: 🧪_FEATURE_TESTING_GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host ""

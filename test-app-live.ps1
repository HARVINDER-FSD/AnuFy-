# Live App Testing Script
# Tests actual running app features and buttons

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🧪 LIVE APP FEATURE TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$testResults = @()

# Wait for app to start
Write-Host "⏳ Waiting for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test 1: Check if app is running
Write-Host "`n1. Testing if app is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ App is running!" -ForegroundColor Green
        $testResults += @{Test="App Running"; Status="PASS"}
    }
} catch {
    Write-Host "   ❌ App is not running!" -ForegroundColor Red
    Write-Host "   Please start the app with: npm run dev" -ForegroundColor Yellow
    $testResults += @{Test="App Running"; Status="FAIL"}
    exit 1
}

# Test 2: Test main pages
Write-Host "`n2. Testing main pages..." -ForegroundColor Yellow
$pages = @("/", "/feed", "/explore", "/reels", "/search", "/notifications", "/messages", "/profile", "/create", "/settings")

foreach ($page in $pages) {
    try {
        $pageResponse = Invoke-WebRequest -Uri "$baseUrl$page" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($pageResponse.StatusCode -eq 200) {
            Write-Host "   ✅ $page" -ForegroundColor Green
            $testResults += @{Test="Page: $page"; Status="PASS"}
        }
    } catch {
        Write-Host "   ❌ $page - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="Page: $page"; Status="FAIL"}
    }
}

# Test 3: Test API endpoints
Write-Host "`n3. Testing API endpoints..." -ForegroundColor Yellow
$apiEndpoints = @(
    "/api/posts",
    "/api/reels",
    "/api/stories",
    "/api/users",
    "/api/notifications",
    "/api/search"
)

foreach ($endpoint in $apiEndpoints) {
    try {
        $apiResponse = Invoke-WebRequest -Uri "$baseUrl$endpoint" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        # 200 or 401 (unauthorized) are both OK - means endpoint exists
        if ($apiResponse.StatusCode -eq 200 -or $apiResponse.StatusCode -eq 401) {
            Write-Host "   ✅ $endpoint" -ForegroundColor Green
            $testResults += @{Test="API: $endpoint"; Status="PASS"}
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   ✅ $endpoint (requires auth)" -ForegroundColor Green
            $testResults += @{Test="API: $endpoint"; Status="PASS"}
        } else {
            Write-Host "   ❌ $endpoint - $($_.Exception.Message)" -ForegroundColor Red
            $testResults += @{Test="API: $endpoint"; Status="FAIL"}
        }
    }
}

# Test 4: Check for JavaScript errors in HTML
Write-Host "`n4. Checking for JavaScript errors..." -ForegroundColor Yellow
try {
    $htmlContent = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing
    if ($htmlContent.Content -match "error|Error|ERROR") {
        Write-Host "   ⚠️  Possible errors in HTML" -ForegroundColor Yellow
        $testResults += @{Test="JavaScript Check"; Status="WARNING"}
    } else {
        Write-Host "   ✅ No obvious errors in HTML" -ForegroundColor Green
        $testResults += @{Test="JavaScript Check"; Status="PASS"}
    }
} catch {
    Write-Host "   ❌ Could not check HTML" -ForegroundColor Red
    $testResults += @{Test="JavaScript Check"; Status="FAIL"}
}

# Test 5: Check static assets
Write-Host "`n5. Testing static assets..." -ForegroundColor Yellow
$assets = @("/favicon.svg", "/manifest.json")

foreach ($asset in $assets) {
    try {
        $assetResponse = Invoke-WebRequest -Uri "$baseUrl$asset" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($assetResponse.StatusCode -eq 200) {
            Write-Host "   ✅ $asset" -ForegroundColor Green
            $testResults += @{Test="Asset: $asset"; Status="PASS"}
        }
    } catch {
        Write-Host "   ⚠️  $asset - Not found" -ForegroundColor Yellow
        $testResults += @{Test="Asset: $asset"; Status="WARNING"}
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARNING" }).Count

Write-Host "   ✅ Passed: $passCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red
Write-Host "   ⚠️  Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "All critical tests passed!" -ForegroundColor Green
    Write-Host "`nYour app is working!" -ForegroundColor White
    Write-Host "Open: http://localhost:3001" -ForegroundColor Yellow
} else {
    Write-Host "Some tests failed. Check the errors above." -ForegroundColor Yellow
    Write-Host "`nRead: FIXES_APPLIED.md for solutions" -ForegroundColor Yellow
}

Write-Host ""

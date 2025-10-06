# PowerShell script for system diagnostics

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Data Intelligence Assistant Diagnostics" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$issuesFound = 0

# Check 1: Java
Write-Host "[1/10] Checking Java installation..." -ForegroundColor Blue
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "[OK] Java is installed" -ForegroundColor Green
    Write-Host "   $javaVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Java not found" -ForegroundColor Red
    Write-Host "   Fix: Install Java 21+ from https://adoptium.net/" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 2: Maven
Write-Host "[2/10] Checking Maven installation..." -ForegroundColor Blue
try {
    $mavenVersion = mvn -version 2>&1 | Select-String "Apache Maven"
    Write-Host "[OK] Maven is installed" -ForegroundColor Green
    Write-Host "   $mavenVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Maven not found" -ForegroundColor Red
    Write-Host "   Fix: Install Maven from https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 3: Node.js
Write-Host "[3/10] Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "   Fix: Install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 4: Backend Port
Write-Host "[4/10] Checking backend port 8000..." -ForegroundColor Blue
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[OK] Backend process running on port 8000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No process running on port 8000" -ForegroundColor Red
    Write-Host "   Fix: cd backend && run.bat" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 5: Backend Health
Write-Host "[5/10] Checking backend health endpoint..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Backend health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Backend health check failed" -ForegroundColor Red
    Write-Host "   Fix: Restart backend or check logs in backend\app.log" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 6: Database
Write-Host "[6/10] Checking database..." -ForegroundColor Blue
if (Test-Path "backend\data\intelligence.db") {
    $dbSize = (Get-Item "backend\data\intelligence.db").Length / 1KB
    Write-Host "[OK] Database exists ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database file not found" -ForegroundColor Red
    Write-Host "   Fix: Start backend to auto-create database" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 7: AI Provider
Write-Host "[7/10] Checking AI provider..." -ForegroundColor Blue
$aiProvider = if ($env:AI_PROVIDER) { $env:AI_PROVIDER } else { "local" }
Write-Host "   Provider: $aiProvider" -ForegroundColor Gray

if ($aiProvider -eq "local") {
    try {
        $ollamaResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2
        if ($ollamaResponse.StatusCode -eq 200) {
            $models = ($ollamaResponse.Content | ConvertFrom-Json).models
            Write-Host "[OK] Ollama is running with $($models.Count) model(s)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Ollama not running or not accessible" -ForegroundColor Yellow
        Write-Host "   Fix: Install Ollama from https://ollama.ai/download/windows" -ForegroundColor Yellow
    }
} elseif ($aiProvider -eq "oci") {
    $ociConfig = "$env:USERPROFILE\.oci\config"
    if (Test-Path $ociConfig) {
        Write-Host "[OK] OCI config file found" -ForegroundColor Green
        if ($env:OCI_COMPARTMENT_ID) {
            Write-Host "   [OK] Compartment ID configured" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] OCI_COMPARTMENT_ID not set" -ForegroundColor Yellow
            Write-Host "   Fix: Set OCI_COMPARTMENT_ID environment variable" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] OCI config not found" -ForegroundColor Red
        Write-Host "   Fix: Run 'oci setup config' or see backend\OCI_SETUP.md" -ForegroundColor Yellow
        $issuesFound++
    }
}
Write-Host ""

# Check 8: Frontend
Write-Host "[8/10] Checking frontend..." -ForegroundColor Blue
if (Test-Path "frontend\src") {
    Write-Host "[OK] Frontend source exists" -ForegroundColor Green
    if (Test-Path "frontend\node_modules") {
        Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Dependencies not installed" -ForegroundColor Yellow
        Write-Host "   Fix: cd frontend && npm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Frontend source not found" -ForegroundColor Red
    $issuesFound++
}
Write-Host ""

# Check 9: Backend JAR
Write-Host "[9/10] Checking backend build..." -ForegroundColor Blue
if (Test-Path "backend\target\assistant-1.0.0.jar") {
    $jarSize = (Get-Item "backend\target\assistant-1.0.0.jar").Length / 1MB
    Write-Host "[OK] Backend JAR exists ($([math]::Round($jarSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend JAR not found" -ForegroundColor Red
    Write-Host "   Fix: cd backend && mvn clean package -DskipTests" -ForegroundColor Yellow
    $issuesFound++
}
Write-Host ""

# Check 10: Frontend Port
Write-Host "[10/10] Checking frontend port 3000..." -ForegroundColor Blue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "[OK] Frontend running on port 3000" -ForegroundColor Green
} else {
    Write-Host "[INFO] Frontend not running" -ForegroundColor Cyan
    Write-Host "   Info: cd frontend && npm start" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($issuesFound -eq 0) {
    Write-Host "[OK] All checks passed! System is healthy." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Found $issuesFound issue(s) that need attention." -ForegroundColor Red
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  Start Backend:  cd backend && run.bat" -ForegroundColor Gray
Write-Host "  Build Backend:  cd backend && mvn clean package -DskipTests" -ForegroundColor Gray
Write-Host "  Start Frontend: cd frontend && npm start" -ForegroundColor Gray
Write-Host "  View DB:        sqlite3 backend\data\intelligence.db" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"

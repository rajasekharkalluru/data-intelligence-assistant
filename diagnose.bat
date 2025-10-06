@echo off
setlocal enabledelayedexpansion

REM Windows batch script for system diagnostics

echo ==========================================
echo   Data Intelligence Assistant Diagnostics
echo ==========================================
echo.

set ISSUES_FOUND=0

REM Check 1: Java
echo [1/10] Checking Java installation...
java -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Java is installed
) else (
    echo [ERROR] Java not found
    echo    Fix: Install Java 21+ from https://adoptium.net/
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 2: Maven
echo [2/10] Checking Maven installation...
mvn -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Maven is installed
) else (
    echo [ERROR] Maven not found
    echo    Fix: Install Maven from https://maven.apache.org/download.cgi
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 3: Node.js
echo [3/10] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
) else (
    echo [ERROR] Node.js not found
    echo    Fix: Install Node.js 18+ from https://nodejs.org/
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 4: Backend Port
echo [4/10] Checking backend port 8000...
netstat -an | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend process running on port 8000
) else (
    echo [ERROR] No process running on port 8000
    echo    Fix: cd backend ^&^& run.bat
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 5: Backend Health
echo [5/10] Checking backend health endpoint...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend health check passed
) else (
    echo [ERROR] Backend health check failed
    echo    Fix: Restart backend or check logs in backend\app.log
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 6: Database
echo [6/10] Checking database...
if exist "backend\data\intelligence.db" (
    echo [OK] Database exists
) else (
    echo [ERROR] Database file not found
    echo    Fix: Start backend to auto-create database
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 7: AI Provider
echo [7/10] Checking AI provider...
if not defined AI_PROVIDER set AI_PROVIDER=local
echo    Provider: %AI_PROVIDER%

if "%AI_PROVIDER%"=="local" (
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Ollama is running
    ) else (
        echo [WARNING] Ollama not running or not accessible
        echo    Fix: Install Ollama from https://ollama.ai/download/windows
    )
) else if "%AI_PROVIDER%"=="oci" (
    if exist "%USERPROFILE%\.oci\config" (
        echo [OK] OCI config file found
    ) else (
        echo [ERROR] OCI config not found
        echo    Fix: See backend\OCI_SETUP.md
        set /a ISSUES_FOUND+=1
    )
)
echo.

REM Check 8: Frontend
echo [8/10] Checking frontend...
if exist "frontend\src" (
    echo [OK] Frontend source exists
    if exist "frontend\node_modules" (
        echo    [OK] Dependencies installed
    ) else (
        echo    [WARNING] Dependencies not installed
        echo    Fix: cd frontend ^&^& npm install
    )
) else (
    echo [ERROR] Frontend source not found
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 9: Backend JAR
echo [9/10] Checking backend build...
if exist "backend\target\assistant-1.0.0.jar" (
    echo [OK] Backend JAR exists
) else (
    echo [ERROR] Backend JAR not found
    echo    Fix: cd backend ^&^& mvn clean package -DskipTests
    set /a ISSUES_FOUND+=1
)
echo.

REM Check 10: Frontend Port
echo [10/10] Checking frontend port 3000...
netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend running on port 3000
) else (
    echo [INFO] Frontend not running
    echo    Info: cd frontend ^&^& npm start
)
echo.

REM Summary
echo ==========================================
if %ISSUES_FOUND% equ 0 (
    echo [OK] All checks passed! System is healthy.
) else (
    echo [ERROR] Found %ISSUES_FOUND% issue^(s^) that need attention.
)
echo ==========================================
echo.

echo Quick Commands:
echo   Start Backend:  cd backend ^&^& run.bat
echo   Build Backend:  cd backend ^&^& mvn clean package -DskipTests
echo   Start Frontend: cd frontend ^&^& npm start
echo   View DB:        sqlite3 backend\data\intelligence.db
echo.

pause

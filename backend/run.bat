@echo off
REM Windows batch script to run the backend

echo ========================================
echo   Data Intelligence Assistant Backend
echo ========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 21 or higher
    echo Download from: https://adoptium.net/
    pause
    exit /b 1
)

REM Check if Maven is installed
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven 3.6+
    echo Download from: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

REM Check if JAR exists
if not exist "target\assistant-1.0.0.jar" (
    echo JAR file not found. Building project...
    echo.
    call mvn clean package -DskipTests
    if %errorlevel% neq 0 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
)

echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo Press Ctrl+C to stop
echo.

java -jar target\assistant-1.0.0.jar

pause

#!/bin/bash

# Data Intelligence Assistant - Java Backend Startup Script

echo "🚀 Starting Data Intelligence Assistant (Java Backend)"
echo "=================================================="

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 21 or higher."
    echo "   Download from: https://adoptium.net/"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 21 ]; then
    echo "❌ Java 21 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java version: $(java -version 2>&1 | head -n 1)"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven 3.9 or higher."
    echo "   Download from: https://maven.apache.org/download.cgi"
    exit 1
fi

echo "✅ Maven version: $(mvn -version | head -n 1)"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Warning: Ollama is not running on localhost:11434"
    echo "   Please start Ollama: ollama serve"
    echo "   Continuing anyway..."
fi

# Create data directory
mkdir -p data logs

echo ""
echo "📦 Building project..."
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting application..."
echo "   API: http://localhost:8000"
echo "   Health: http://localhost:8000/health"
echo ""

# Run the application
java -jar target/assistant-1.0.0.jar

#!/bin/bash

# Developer Intelligence Assistant - Java Backend Startup Script

set -e

echo "🚀 Starting Developer Intelligence Assistant Backend (Java)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    if command_exists lsof; then
        lsof -i :$1 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -an | grep ":$1 " >/dev/null 2>&1
    else
        # Fallback: try to connect to the port
        timeout 1 bash -c "</dev/tcp/localhost/$1" >/dev/null 2>&1
    fi
}

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Java
if ! command_exists java; then
    echo -e "${RED}❌ Java is required but not installed${NC}"
    echo -e "${YELLOW}   Please install Java 21 or later${NC}"
    exit 1
fi

# Check Maven
if ! command_exists mvn; then
    echo -e "${RED}❌ Maven is required but not installed${NC}"
    echo -e "${YELLOW}   Please install Maven from: https://maven.apache.org${NC}"
    exit 1
fi

# Check Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}⚠️  Ollama not found. Please install Ollama for local AI model support${NC}"
    echo -e "${YELLOW}   Visit: https://ollama.ai${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Navigate to backend directory
cd backend

# Check if Ollama model is available
if command_exists ollama; then
    echo -e "${BLUE}Checking Ollama model...${NC}"
    
    # Check if Ollama service is running
    if ! ollama list >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Ollama service not running. Please start Ollama first.${NC}"
        echo -e "${YELLOW}   Run: ollama serve${NC}"
    else
        if ! ollama list | grep -q "llama3.2"; then
            echo -e "${YELLOW}Downloading llama3.2 model (this may take a while)...${NC}"
            if ! ollama pull llama3.2; then
                echo -e "${YELLOW}⚠️  Failed to download llama3.2 model. You can download it later with: ollama pull llama3.2${NC}"
            fi
        fi
        echo -e "${GREEN}✅ Ollama model ready${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama not installed. AI features will not work.${NC}"
fi

# Build the application
echo -e "${BLUE}Building Java application...${NC}"
if ! mvn clean package -DskipTests; then
    echo -e "${RED}❌ Failed to build Java application${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Check if port 8000 is already in use
if port_in_use 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Stopping existing process...${NC}"
    # Kill process using port 8000
    if command_exists lsof; then
        PID=$(lsof -ti :8000)
        if [ ! -z "$PID" ]; then
            kill -9 $PID
            sleep 2
        fi
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down backend server...${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting Java backend server...${NC}"
echo -e "${BLUE}Backend will be available at: http://localhost:8000${NC}"
echo -e "${BLUE}API Documentation: http://localhost:8000/swagger-ui.html${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop the backend server${NC}\n"

# Start backend with proper error handling
java -jar target/assistant-1.0.0.jar
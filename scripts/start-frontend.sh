#!/bin/bash

# Developer Intelligence Assistant - Frontend Startup Script

set -e

echo "🚀 Starting Developer Intelligence Assistant Frontend..."

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

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    echo -e "${YELLOW}   Please install Node.js from: https://nodejs.org${NC}"
    exit 1
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    if ! npm install; then
        echo -e "${RED}❌ Failed to install Node.js dependencies with npm install${NC}"
        echo -e "${YELLOW}Trying npm ci...${NC}"
        npm ci || {
            echo -e "${RED}❌ Failed to install Node.js dependencies with npm ci${NC}"
            echo -e "${YELLOW}Trying to clear cache and reinstall...${NC}"
            npm cache clean --force
            rm -rf node_modules package-lock.json
            npm install || {
                echo -e "${RED}❌ All npm install attempts failed${NC}"
                exit 1
            }
        }
    fi
else
    echo -e "${GREEN}✅ Node modules already installed${NC}"
fi

# Check if backend is running
echo -e "${BLUE}Checking backend connection...${NC}"
if port_in_use 8000; then
    echo -e "${GREEN}✅ Backend server detected on port 8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server not detected on port 8000${NC}"
    echo -e "${YELLOW}   Please start the backend first with: ./scripts/start-backend.sh${NC}"
    echo -e "${YELLOW}   Or run both with: ./scripts/start-dev.sh${NC}"
    echo -e "${BLUE}Continuing anyway... Frontend will show connection errors until backend is started.${NC}"
fi

# Check if port 3000 is already in use
if port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Stopping existing process...${NC}"
    # Kill process using port 3000
    if command_exists lsof; then
        PID=$(lsof -ti :3000)
        if [ ! -z "$PID" ]; then
            kill -9 $PID
            sleep 2
        fi
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down frontend server...${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start frontend
echo -e "${BLUE}Starting frontend development server...${NC}"
echo -e "${BLUE}Frontend will be available at: http://localhost:3000${NC}"
echo -e "${BLUE}The page will automatically reload when you make changes.${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop the frontend server${NC}\n"

# Set environment variables for better development experience
export BROWSER=none  # Prevent auto-opening browser
export CHOKIDAR_USEPOLLING=true  # Better file watching on some systems

# Start frontend development server
npm start
#!/bin/bash

# Developer Intelligence Assistant - Backend Startup Script

set -e

echo "🚀 Starting Developer Intelligence Assistant Backend..."

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

# Check Python
if ! command_exists python; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

# Check Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}⚠️  Ollama not found. Please install Ollama for local AI model support${NC}"
    echo -e "${YELLOW}   Visit: https://ollama.ai${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Create data directory for ChromaDB and SQLite
mkdir -p backend/data

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    cd backend
    python -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
cd backend
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Install dependencies with error handling
if ! pip install -r requirements.txt; then
    echo -e "${RED}❌ Failed to install Python dependencies${NC}"
    echo -e "${YELLOW}Trying to install with --no-cache-dir...${NC}"
    pip install --no-cache-dir -r requirements.txt
fi

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
if [ -f "init_db.py" ]; then
    python init_db.py
else
    echo -e "${YELLOW}⚠️  init_db.py not found, skipping database initialization${NC}"
fi

# Seed demo accounts
echo -e "${BLUE}Creating demo accounts...${NC}"
if [ -f "seed_demo_accounts.py" ]; then
    python seed_demo_accounts.py
else
    echo -e "${YELLOW}⚠️  seed_demo_accounts.py not found, skipping demo accounts${NC}"
fi

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

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating environment configuration...${NC}"
    
    # Generate a random secret key
    SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
    ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    
    cat > .env << EOF
# Security Configuration
SECRET_KEY=${SECRET_KEY}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Database Configuration (SQLite for development)
DATABASE_URL=sqlite:///./data/dia.db

# Ollama Configuration
OLLAMA_MODEL=llama3.2

# Slack Bot Configuration (optional)
# SLACK_BOT_TOKEN=xoxb-your-bot-token
# SLACK_APP_TOKEN=xapp-your-app-token
EOF
    echo -e "${GREEN}✅ Created .env file with secure keys.${NC}"
fi

# Check if the main app exists
if [ ! -f "app/main.py" ]; then
    echo -e "${RED}❌ Backend app/main.py not found${NC}"
    deactivate
    exit 1
fi

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
    deactivate 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
echo -e "${BLUE}Backend will be available at: http://localhost:8000${NC}"
echo -e "${BLUE}API Documentation: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop the backend server${NC}\n"

# Start backend with proper error handling
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Deactivate virtual environment on exit
deactivate
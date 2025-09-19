#!/bin/bash

# Developer Intelligence Assistant - Development Startup Script

set -e

echo "🚀 Starting Developer Intelligence Assistant in development mode..."

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
    lsof -i :$1 >/dev/null 2>&1
}

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Python
if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
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
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
python init_db.py
cd ..

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Install CLI dependencies
echo -e "${BLUE}Installing CLI dependencies...${NC}"
cd cli
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Check if Ollama model is available
if command_exists ollama; then
    echo -e "${BLUE}Checking Ollama model...${NC}"
    if ! ollama list | grep -q "llama3.2"; then
        echo -e "${YELLOW}Downloading llama3.2 model (this may take a while)...${NC}"
        ollama pull llama3.2
    fi
    echo -e "${GREEN}✅ Ollama model ready${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}Creating environment configuration...${NC}"
    
    # Generate a random secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    
    cat > backend/.env << EOF
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

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    jobs -p | xargs -r kill
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
if port_in_use 8000; then
    echo -e "${GREEN}✅ Backend server running on http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo -e "${BLUE}Waiting for frontend to start...${NC}"
sleep 5

if port_in_use 3000; then
    echo -e "${GREEN}✅ Frontend server running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Failed to start frontend server${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "\n${GREEN}🎉 Developer Intelligence Assistant is running!${NC}"
echo -e "${BLUE}📱 Web UI: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 API: http://localhost:8000${NC}"
echo -e "${BLUE}📚 API Docs: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to stop
wait
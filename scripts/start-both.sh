#!/bin/bash

# Developer Intelligence Assistant - Start Both Services Script

echo "🚀 Starting Developer Intelligence Assistant (Backend + Frontend)"

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

# Check if we're on macOS or Linux for terminal opening
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TERMINAL_CMD="osascript -e 'tell application \"Terminal\" to do script"
elif command_exists gnome-terminal; then
    # Linux with GNOME Terminal
    TERMINAL_CMD="gnome-terminal --"
elif command_exists xterm; then
    # Linux with xterm
    TERMINAL_CMD="xterm -e"
else
    echo -e "${YELLOW}⚠️  Could not detect terminal application. Please run the scripts manually:${NC}"
    echo -e "${BLUE}Terminal 1: ./scripts/start-backend.sh${NC}"
    echo -e "${BLUE}Terminal 2: ./scripts/start-frontend.sh${NC}"
    exit 1
fi

echo -e "${BLUE}Opening backend in new terminal...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && ./scripts/start-backend.sh\""
else
    # Linux
    $TERMINAL_CMD "cd $(pwd) && ./scripts/start-backend.sh; exec bash" &
fi

# Wait a moment for backend to start
sleep 3

echo -e "${BLUE}Opening frontend in new terminal...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && ./scripts/start-frontend.sh\""
else
    # Linux
    $TERMINAL_CMD "cd $(pwd) && ./scripts/start-frontend.sh; exec bash" &
fi

echo -e "\n${GREEN}✅ Both services are starting in separate terminals${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}📚 API Docs: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Close the terminal windows to stop the services${NC}"
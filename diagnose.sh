#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Data Intelligence Assistant Diagnostics"
echo "=========================================="
echo ""

ISSUES_FOUND=0

# Check 1: Backend Port
echo -e "${BLUE}[1/10]${NC} Checking backend port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend process running on port 8000${NC}"
else
    echo -e "${RED}❌ No process running on port 8000${NC}"
    echo "   Fix: cd backend && java -jar target/assistant-1.0.0.jar &"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 2: Backend Health
echo -e "${BLUE}[2/10]${NC} Checking backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    echo "   Fix: Restart backend or check logs in backend/app.log"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 3: Database
echo -e "${BLUE}[3/10]${NC} Checking database..."
if [ -f "backend/data/intelligence.db" ]; then
    DB_SIZE=$(ls -lh backend/data/intelligence.db | awk '{print $5}')
    echo -e "${GREEN}✅ Database exists (${DB_SIZE})${NC}"
    
    # Check for users
    USER_COUNT=$(sqlite3 backend/data/intelligence.db "SELECT COUNT(*) FROM users;" 2>/dev/null)
    if [ "$USER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✓ Found $USER_COUNT user(s) in database${NC}"
    else
        echo -e "${YELLOW}   ⚠ No users found in database${NC}"
        echo "   Info: Create users via /auth/register endpoint"
    fi
else
    echo -e "${RED}❌ Database file not found${NC}"
    echo "   Fix: Start backend to auto-create database"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 4: Demo Accounts
echo -e "${BLUE}[4/10]${NC} Checking demo accounts..."
if [ -f "backend/data/intelligence.db" ]; then
    DEMO_EXISTS=$(sqlite3 backend/data/intelligence.db "SELECT COUNT(*) FROM users WHERE username='demo';" 2>/dev/null)
    ADMIN_EXISTS=$(sqlite3 backend/data/intelligence.db "SELECT COUNT(*) FROM users WHERE username='admin';" 2>/dev/null)
    
    if [ "$DEMO_EXISTS" = "1" ]; then
        echo -e "${GREEN}✅ Demo user exists${NC}"
    else
        echo -e "${YELLOW}⚠ Demo user not found${NC}"
        echo "   Fix: curl -X POST http://localhost:8000/auth/register -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"email\":\"demo@example.com\",\"password\":\"demo123\"}'"
    fi
    
    if [ "$ADMIN_EXISTS" = "1" ]; then
        echo -e "${GREEN}✅ Admin user exists${NC}"
    else
        echo -e "${YELLOW}⚠ Admin user not found${NC}"
        echo "   Fix: curl -X POST http://localhost:8000/auth/register -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"email\":\"admin@example.com\",\"password\":\"admin123\"}'"
    fi
fi
echo ""

# Check 5: Authentication
echo -e "${BLUE}[5/10]${NC} Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}' 2>/dev/null)

if echo "$AUTH_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ Authentication working${NC}"
    TOKEN=$(echo $AUTH_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "   Response: $AUTH_RESPONSE"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    TOKEN=""
fi
echo ""

# Check 6: Ollama
echo -e "${BLUE}[6/10]${NC} Checking Ollama service..."
OLLAMA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags 2>/dev/null)
if [ "$OLLAMA_RESPONSE" = "200" ]; then
    MODEL_COUNT=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name"' | wc -l)
    echo -e "${GREEN}✅ Ollama running with $MODEL_COUNT model(s)${NC}"
else
    echo -e "${YELLOW}⚠ Ollama not running or not accessible${NC}"
    echo "   Info: Models endpoint will return defaults"
    echo "   Fix: Start Ollama service"
fi
echo ""

# Check 7: Models Endpoint
if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}[7/10]${NC} Testing models endpoint..."
    MODELS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/models 2>/dev/null)
    if echo "$MODELS_RESPONSE" | grep -q "models"; then
        MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"name"' | wc -l)
        echo -e "${GREEN}✅ Models endpoint working ($MODEL_COUNT models available)${NC}"
    else
        echo -e "${RED}❌ Models endpoint failed${NC}"
        echo "   Response: $MODELS_RESPONSE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${BLUE}[7/10]${NC} ${YELLOW}⊘ Skipping models endpoint (no auth token)${NC}"
fi
echo ""

# Check 8: Core Endpoints
if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}[8/10]${NC} Testing core endpoints..."
    
    ENDPOINTS=(
        "/auth/me:User profile"
        "/chat/sessions:Chat sessions"
        "/data-sources:Data sources"
        "/teams:Teams"
        "/analytics/stats:Analytics"
    )
    
    ENDPOINT_FAILURES=0
    for endpoint_info in "${ENDPOINTS[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:8000$endpoint" 2>/dev/null)
        if [ "$RESPONSE" = "200" ]; then
            echo -e "   ${GREEN}✓${NC} $name"
        else
            echo -e "   ${RED}✗${NC} $name (HTTP $RESPONSE)"
            ENDPOINT_FAILURES=$((ENDPOINT_FAILURES + 1))
        fi
    done
    
    if [ $ENDPOINT_FAILURES -eq 0 ]; then
        echo -e "${GREEN}✅ All core endpoints working${NC}"
    else
        echo -e "${RED}❌ $ENDPOINT_FAILURES endpoint(s) failed${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${BLUE}[8/10]${NC} ${YELLOW}⊘ Skipping core endpoints (no auth token)${NC}"
fi
echo ""

# Check 9: Backend JAR
echo -e "${BLUE}[9/10]${NC} Checking backend build..."
if [ -f "backend/target/assistant-1.0.0.jar" ]; then
    JAR_SIZE=$(ls -lh backend/target/assistant-1.0.0.jar | awk '{print $5}')
    echo -e "${GREEN}✅ Backend JAR exists (${JAR_SIZE})${NC}"
else
    echo -e "${RED}❌ Backend JAR not found${NC}"
    echo "   Fix: cd backend && mvn clean package -DskipTests"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 10: Frontend
echo -e "${BLUE}[10/10]${NC} Checking frontend..."
if [ -d "frontend/src" ]; then
    echo -e "${GREEN}✅ Frontend source exists${NC}"
    
    # Check for node_modules
    if [ -d "frontend/node_modules" ]; then
        echo -e "   ${GREEN}✓${NC} Dependencies installed"
    else
        echo -e "   ${YELLOW}⚠${NC} Dependencies not installed"
        echo "   Fix: cd frontend && npm install"
    fi
    
    # Check if frontend is running
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} Frontend running on port 3000"
    else
        echo -e "   ${YELLOW}⚠${NC} Frontend not running"
        echo "   Info: cd frontend && npm start"
    fi
else
    echo -e "${RED}❌ Frontend source not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Summary
echo "=========================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is healthy.${NC}"
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need attention.${NC}"
fi
echo "=========================================="
echo ""

# Additional Info
echo "Quick Commands:"
echo "  Start Backend:  cd backend && java -jar target/assistant-1.0.0.jar &"
echo "  Build Backend:  cd backend && mvn clean package -DskipTests"
echo "  Start Frontend: cd frontend && npm start"
echo "  View DB:        sqlite3 backend/data/intelligence.db"
echo "  Backend Logs:   tail -f backend/app.log"
echo ""

exit $ISSUES_FOUND

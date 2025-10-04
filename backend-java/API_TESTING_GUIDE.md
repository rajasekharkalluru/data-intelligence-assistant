# API Testing Guide - Java Backend

## 🚀 Quick Start

### 1. Start the Server

```bash
cd backend-java
./run.sh
```

Or manually:
```bash
mvn spring-boot:run
```

Server will start on: `http://localhost:8000`

---

## 📡 API Endpoints

### Health Check

```bash
# Root endpoint
curl http://localhost:8000/

# Health check
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy"
}
```

---

## 🔐 Authentication

### 1. Register New User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "isActive": true,
    "isAdmin": false,
    "createdAt": "2025-10-04T..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Expected Response:** Same as register

### 3. Get Current User

```bash
# Save token from login/register
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "isActive": true,
  "isAdmin": false,
  "createdAt": "2025-10-04T..."
}
```

---

## 💬 Chat Endpoints

### 1. Create Chat Session

```bash
curl -X POST http://localhost:8000/chat/sessions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "New Chat",
  "created_at": "2025-10-04T...",
  "updated_at": "2025-10-04T...",
  "message_count": 0
}
```

### 2. List Chat Sessions

```bash
curl -X GET http://localhost:8000/chat/sessions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "title": "New Chat",
    "created_at": "2025-10-04T...",
    "updated_at": "2025-10-04T...",
    "message_count": 0
  }
]
```

### 3. Send Query (AI Chat)

```bash
curl -X POST http://localhost:8000/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Spring Boot?",
    "sessionId": 1,
    "responseType": "concise",
    "temperature": 0.7,
    "model": "llama3.2"
  }'
```

**Expected Response:**
```json
{
  "response": "Spring Boot is a framework that simplifies Java application development...",
  "sources": [],
  "sessionId": 1
}
```

### 4. Get Session Messages

```bash
curl -X GET http://localhost:8000/chat/sessions/1/messages \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "type": "user",
    "content": "What is Spring Boot?",
    "sources": null,
    "timestamp": "2025-10-04T..."
  },
  {
    "id": 2,
    "type": "assistant",
    "content": "Spring Boot is a framework...",
    "sources": "[]",
    "timestamp": "2025-10-04T..."
  }
]
```

### 5. Update Session Title

```bash
curl -X PUT http://localhost:8000/chat/sessions/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Boot Discussion"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "Spring Boot Discussion",
  "updated_at": "2025-10-04T..."
}
```

### 6. Delete Session

```bash
curl -X DELETE http://localhost:8000/chat/sessions/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Session deleted successfully"
}
```

---

## 🧪 Complete Test Flow

### Full Workflow Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "🧪 Testing Java Backend API"
echo "============================"

# 1. Health Check
echo -e "\n1️⃣ Health Check..."
curl -s $BASE_URL/health | jq

# 2. Register User
echo -e "\n2️⃣ Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }')

echo $REGISTER_RESPONSE | jq

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
echo "Token: ${TOKEN:0:50}..."

# 3. Get Current User
echo -e "\n3️⃣ Getting current user..."
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Create Chat Session
echo -e "\n4️⃣ Creating chat session..."
SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/chat/sessions \
  -H "Authorization: Bearer $TOKEN")

echo $SESSION_RESPONSE | jq

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.id')
echo "Session ID: $SESSION_ID"

# 5. Send Query
echo -e "\n5️⃣ Sending query..."
curl -s -X POST $BASE_URL/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What is Java?\",
    \"sessionId\": $SESSION_ID,
    \"responseType\": \"brief\"
  }" | jq

# 6. Get Messages
echo -e "\n6️⃣ Getting messages..."
curl -s -X GET $BASE_URL/chat/sessions/$SESSION_ID/messages \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. List Sessions
echo -e "\n7️⃣ Listing sessions..."
curl -s -X GET $BASE_URL/chat/sessions \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n✅ All tests completed!"
```

Save as `test-api.sh` and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Error Responses

### 400 Bad Request
```json
{
  "error": "Username already exists"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid username or password"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred",
  "message": "Detailed error message"
}
```

---

## 📊 Response Types

### Brief
- 1-2 sentences
- Direct answer
- No examples

### Concise (Default)
- Clear answer
- Key details
- Some context

### Expansive
- Comprehensive
- Detailed explanations
- Examples included

---

## 🔧 Troubleshooting

### "Connection refused"
```bash
# Check if server is running
curl http://localhost:8000/health

# If not, start it
cd backend-java
./run.sh
```

### "Unauthorized" errors
```bash
# Make sure you're using a valid token
# Tokens expire after 24 hours
# Re-login to get a new token
```

### "Ollama not available"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Pull the model
ollama pull llama3.2
```

### Database errors
```bash
# Delete and recreate database
rm -rf backend-java/data/
# Restart the server - it will recreate the database
```

---

## 📝 Notes

1. **Tokens expire after 24 hours** - Re-login to get a new token
2. **Database is SQLite** - Stored in `backend-java/data/intelligence.db`
3. **Logs are in** - `backend-java/logs/application.log`
4. **CORS is enabled** - Frontend on localhost:3000 can access the API
5. **All endpoints except /auth/** require authentication

---

## 🎯 Next Steps

Once you've tested the core API:

1. Test with the React frontend
2. Add data sources (coming in Phase 3)
3. Test vector search integration
4. Performance testing with load tools

---

*Last Updated: October 4, 2025*
*API Version: 1.0.0*
*Status: Core endpoints functional*

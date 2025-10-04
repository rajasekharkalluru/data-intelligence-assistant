# Developer Intelligence Assistant

AI-powered knowledge base system that integrates with your development tools (Confluence, JIRA, Bitbucket) to provide intelligent answers using RAG (Retrieval-Augmented Generation).

## Features

- 🤖 **Multiple Interfaces**: Web UI, CLI, and Slack Bot
- 🔌 **Data Source Connectors**: Confluence, Bitbucket, JIRA
- 🧠 **Local AI**: Uses Ollama (llama3.2) for privacy-focused responses
- 📊 **Vector Search**: ChromaDB for semantic search
- 🔐 **Secure**: User authentication with encrypted credential storage
- 🔄 **Smart Sync**: Incremental and event-driven updates

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd data-intelligence-assistant
   ```

2. **Start the application**
   
   Choose one of these options:
   
   ```bash
   # Option A: Auto-open both in separate terminals (recommended)
   ./scripts/start-both.sh
   
   # Option B: Manual - separate terminals for debugging
   ./scripts/start-backend.sh    # Terminal 1
   ./scripts/start-frontend.sh   # Terminal 2
   ```

3. **Access the application**
   - Web UI: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Login with demo account**
   - Click "Demo User" or "Admin User" button on login screen
   - Or manually enter: `demo` / `demo123` or `admin` / `admin123`
   - Or create your own account by clicking "Sign up"

## Usage

### Web Interface

1. Register/login at http://localhost:3000
2. Add data sources in the Sources tab
3. Sync your data
4. Ask questions in the chat interface

### CLI

```bash
cd cli
pip install -r requirements.txt

# Register and login
./dia_cli.py register
./dia_cli.py login

# Ask questions
./dia_cli.py ask "How do I deploy the application?"

# Manage sources
./dia_cli.py sources
./dia_cli.py sync 1

# Interactive mode
./dia_cli.py interactive
```

### Slack Bot

1. Create a Slack app at https://api.slack.com/apps
2. Enable Socket Mode and generate tokens
3. Add Bot Token Scopes: `chat:write`, `im:read`, `channels:read`
4. Set environment variables in `backend/.env`:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   ```
5. Run: `cd slack-bot && python slack_bot.py`

## Configuration

### Environment Variables

The backend `.env` file is auto-generated on first run with secure keys. You only need to customize it if you want to:
- Use a different Ollama model
- Configure Slack bot tokens
- Change database location

See `backend/.env.example` for available options.

### Adding Data Sources

**Via Web UI:**
- Go to Sources tab → Click "+" → Enter credentials → Test & Sync

**Supported Sources:**
- **Confluence**: Space key, API token
- **JIRA**: Project key, API token
- **Bitbucket**: Workspace, repository, API token

### Response Types

- **Brief**: Quick answers (1-2 sentences)
- **Concise**: Clear answers with key details
- **Expansive**: Comprehensive responses with examples

## Project Structure

```
data-intelligence-assistant/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── connectors/  # Data source connectors
│   │   ├── models/      # Pydantic models
│   │   ├── services/    # Business logic
│   │   └── main.py      # FastAPI app
│   ├── data/            # SQLite DB & ChromaDB
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   └── App.js
│   └── package.json
├── cli/                 # Command-line interface
│   └── dia_cli.py
├── slack-bot/          # Slack bot integration
│   └── slack_bot.py
└── scripts/            # Startup scripts
    ├── start-both.sh      # Auto-open both services
    ├── start-backend.sh   # Backend only
    └── start-frontend.sh  # Frontend only
```

## Troubleshooting

**Ollama not found**
```bash
# Install from https://ollama.ai, then:
ollama pull llama3.2
```

**Port conflicts**
```bash
# Check if ports 3000 or 8000 are in use
lsof -i :3000
lsof -i :8000
```

**Backend won't start**
```bash
# Check logs in the terminal
# Common issues: missing dependencies, Ollama not running
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend compilation errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Proxy errors for favicon.ico**
```
Proxy error: Could not proxy request /favicon.ico
```
This warning is harmless and can be ignored. The backend doesn't serve favicons.

## Development

### What the Scripts Do

The startup scripts will automatically:
- Check prerequisites (Python, Node.js, Ollama)
- Create Python virtual environment
- Install all dependencies
- Initialize SQLite database
- Generate secure encryption keys
- Download Ollama model (llama3.2)
- Start the services

### Manual Setup (Optional)

If you prefer manual setup:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Adding Custom Data Sources

1. Create connector in `backend/app/connectors/your_connector.py`
2. Extend `BaseConnector` class
3. Implement `fetch_documents()` method
4. Register in `connector_service.py`

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, ChromaDB
- **Frontend**: React, Tailwind CSS
- **AI**: Ollama (llama3.2), SentenceTransformers
- **Database**: SQLite (dev), ChromaDB (vectors)
- **Auth**: JWT tokens, Fernet encryption

## License

MIT License

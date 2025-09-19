# Developer Intelligence Assistant

A comprehensive AI-powered knowledge base system that integrates with your development tools to provide intelligent answers using RAG (Retrieval-Augmented Generation) technology.

## Features

- 🤖 **Multiple Interfaces**: Web UI, CLI, and Slack Bot
- 🔌 **Data Source Connectors**: Confluence, Bitbucket, JIRA (extensible)
- 🧠 **Local AI**: Uses Ollama (llama3.2) for privacy-focused AI responses
- 📊 **Vector Search**: ChromaDB for efficient semantic search
- ⚙️ **Customizable**: Response types (Brief, Concise, Expansive) and temperature control
- 🔗 **Source Attribution**: Clickable links to original content
- 🎨 **Brandable**: Customizable branding and logos

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │      CLI        │    │   Slack Bot     │
│   (React)       │    │   (Python)      │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   FastAPI       │
                    │   Backend       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RAG Service   │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │  ChromaDB   │ │
                    │ │ (Vectors)   │ │
                    │ └─────────────┘ │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │   Ollama    │ │
                    │ │ (llama3.2)  │ │
                    │ └─────────────┘ │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Connectors    │
                    │                 │
                    │ • Confluence    │
                    │ • Bitbucket     │
                    │ • JIRA          │
                    └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (for local AI)

### Development Setup

1. **Clone and start the development environment:**
   ```bash
   ./scripts/start-dev.sh
   ```

   This script will:
   - Check prerequisites
   - Create Python virtual environment
   - Install all dependencies
   - Initialize SQLite database
   - Generate secure encryption keys
   - Download Ollama model (llama3.2)
   - Start both backend and frontend servers

2. **Access the application:**
   - Web UI: http://localhost:3000
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

3. **Create your account:**
   - Open the web UI and register a new account
   - Or use the CLI: `./cli/dia_cli.py register`

### Manual Setup

If you prefer manual setup:

1. **Backend Setup:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Install Ollama and pull model:**
   ```bash
   # Install Ollama (visit https://ollama.ai for instructions)
   ollama pull llama3.2
   ```

## Configuration

### User Authentication & Data Sources

The system now includes secure user authentication and per-user data source management:

- **User Registration/Login**: Create accounts through the web UI or CLI
- **Secure Credential Storage**: Data source credentials are encrypted in the database
- **Per-User Data Sources**: Each user manages their own data source configurations
- **Profile Management**: Users can update their profiles and manage their data sources

### Adding Data Sources

1. **Via Web UI:**
   - Go to the Sources tab
   - Click the "+" button to add a new data source
   - Enter your credentials (they're encrypted and stored securely)
   - Test the connection and sync data

2. **Via CLI:**
   ```bash
   ./cli/dia_cli.py login
   ./cli/dia_cli.py sources  # List your sources
   ```

### Slack Bot Setup

1. Create a Slack app at https://api.slack.com/apps
2. Enable Socket Mode and generate App Token
3. Add Bot Token Scopes: `chat:write`, `im:read`, `channels:read`
4. Configure environment variables:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   ```
5. Run the bot:
   ```bash
   cd slack-bot
   python slack_bot.py
   ```

## Usage

### Web Interface

1. Open http://localhost:3000
2. Configure your data sources in the Sources tab
3. Sync data from your sources
4. Start asking questions in the chat interface

### CLI Usage

```bash
# Install CLI dependencies
cd cli
pip install -r requirements.txt

# Make CLI executable
chmod +x dia_cli.py

# Register or login
./dia_cli.py register
./dia_cli.py login

# Ask a question
./dia_cli.py ask "How do I deploy the application?"

# List your data sources
./dia_cli.py sources

# Sync a data source (use source ID from sources command)
./dia_cli.py sync 1

# Interactive mode
./dia_cli.py interactive
```

### Slack Bot

Once configured, mention the bot in any channel or send direct messages:

```
@DIA How do I set up the development environment?
```

## Response Types

- **Brief**: Quick, direct answers (1-2 sentences)
- **Concise**: Clear answers with key details
- **Expansive**: Comprehensive, detailed responses with examples

## Adding Custom Data Sources

1. Create a new connector in `backend/app/connectors/`:
   ```python
   from .base_connector import BaseConnector
   
   class CustomConnector(BaseConnector):
       def __init__(self):
           super().__init__()
           self.display_name = "Custom Source"
           self.description = "Your custom data source"
       
       async def is_configured(self) -> bool:
           # Check configuration
           pass
       
       async def fetch_documents(self) -> List[Dict[str, Any]]:
           # Fetch and return documents
           pass
   ```

2. Register in `backend/app/services/connector_service.py`

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# Start with Slack bot
docker-compose --profile slack up -d

# View logs
docker-compose logs -f
```

## Production Deployment

For production deployment with Oracle Cloud Infrastructure:

1. Update environment variables for OCI services
2. Configure Oracle Generative AI service
3. Set up Oracle Vector Database
4. Deploy using Docker or Kubernetes

## Customization

### Branding

Replace the logo and update branding in:
- `frontend/src/components/Header.js`
- Update colors in `frontend/tailwind.config.js`
- Modify app title and descriptions

### Adding New Response Types

1. Update `backend/app/models/query.py`
2. Modify prompt templates in `backend/app/services/rag_service.py`
3. Update frontend dropdown in `frontend/src/components/SettingsPanel.js`

## Troubleshooting

### Common Issues

1. **Ollama not found**: Install Ollama from https://ollama.ai
2. **Model not available**: Run `ollama pull llama3.2`
3. **Port conflicts**: Check if ports 3000, 8000, or 11434 are in use
4. **Data source connection failed**: Verify API tokens and URLs

### Logs

- Backend logs: Check terminal where uvicorn is running
- Frontend logs: Check browser console
- Slack bot logs: Check terminal where bot is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at http://localhost:8000/docs
3. Create an issue in the repository
## 🔄 **
Intelligent Sync System**

The system includes a sophisticated incremental sync system that efficiently keeps your knowledge base up-to-date without unnecessary overhead.

### **Sync Strategies**

#### **1. Full Sync**
- **When**: First sync, or after 7+ days without sync
- **Process**: Fetches all documents and compares with existing
- **Use Case**: Initial setup, major updates, or recovery

#### **2. Incremental Sync**
- **When**: Regular updates (hourly/daily)
- **Process**: Only fetches documents modified since last sync
- **Benefits**: Faster, less resource intensive, more frequent updates

#### **3. Event-Driven Sync**
- **When**: Real-time via webhooks
- **Process**: Immediate updates when documents change
- **Benefits**: Near real-time updates, minimal delay

### **Supported Incremental Features**

#### **Confluence**
- ✅ **Incremental**: Uses CQL (Confluence Query Language) with `lastModified` filter
- ✅ **Webhooks**: Page created, updated, deleted events
- ✅ **Change Detection**: Content hash comparison for efficient updates

#### **JIRA**
- ✅ **Incremental**: JQL queries with `updated >= date` filter
- ✅ **Webhooks**: Issue created, updated, deleted events
- ✅ **Pagination**: Token-based pagination for large datasets

#### **Bitbucket**
- ✅ **Incremental**: Repository `updated_on` filtering
- ✅ **Webhooks**: Repository push events (README changes)
- ✅ **Change Detection**: Repository-level modification tracking

### **Webhook Setup**

#### **Confluence Webhooks**
```
URL: https://your-domain.com/webhooks/confluence
Events: page_created, page_updated, page_removed
```

#### **JIRA Webhooks**
```
URL: https://your-domain.com/webhooks/jira
Events: jira:issue_created, jira:issue_updated, jira:issue_deleted
```

#### **Bitbucket Webhooks**
```
URL: https://your-domain.com/webhooks/bitbucket
Events: repo:refs_changed (for README updates)
```

### **Performance Benefits**

#### **Efficiency Gains**
- **90%+ Reduction** in sync time for incremental updates
- **Minimal API Calls** to external systems
- **Reduced Load** on source systems
- **Faster Updates** for users

This intelligent sync system ensures your knowledge base stays current while minimizing resource usage and providing near real-time updates when needed!
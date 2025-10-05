# Developer Intelligence Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java 21+](https://img.shields.io/badge/java-21+-blue.svg)](https://www.oracle.com/java/technologies/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.1-6DB33F.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-llama3.2-000000.svg)](https://ollama.ai/)

AI-powered knowledge base system that integrates with your development tools (Confluence, JIRA, Bitbucket) to provide intelligent answers using RAG (Retrieval-Augmented Generation).

## Features

- 🤖 **Multiple Interfaces**: Web UI, CLI, and Slack Bot (all in Java!)
- 🔌 **Data Source Connectors**: Confluence, Bitbucket, JIRA
- 🧠 **Local AI**: Uses Ollama (llama3.2) for privacy-focused responses
- 📊 **Vector Search**: LangChain4j with embeddings for semantic search
- 🔐 **Secure**: JWT authentication with encrypted credential storage
- 🔄 **Smart Sync**: Incremental and event-driven updates
- ☕ **Java Backend**: Spring Boot 3.2.1 with modern architecture

## Quick Start

### Prerequisites

- Java 21+ (or Java 25)
- Maven 3.6+
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
   - API Docs: http://localhost:8000/swagger-ui/index.html
   - OpenAPI Spec: [backend/docs/openapi.yaml](backend/docs/openapi.yaml)

4. **Create your account**
   - Click "Sign up" on the login screen
   - Or use the registration endpoint directly

## Usage

### Web Interface

1. Register/login at http://localhost:3000
2. Add data sources in the Sources tab
3. Sync your data
4. Ask questions in the chat interface

### CLI (Command Line)

```bash
# Build the CLI
cd cli
mvn clean package

# Create an alias (add to ~/.zshrc or ~/.bashrc)
alias dia='java -jar /path/to/cli/target/dia-cli.jar'

# Use the CLI
dia register
dia login
dia ask "How do I deploy the application?"
dia sources
dia sync 1
dia interactive  # Start interactive chat mode
```

See [cli/README.md](cli/README.md) for full documentation.

### Slack Bot

```bash
# Build the bot
cd slack-bot
mvn clean package

# Configure (see slack-bot/README.md for Slack app setup)
export SLACK_BOT_TOKEN="xoxb-your-token"
export SLACK_APP_TOKEN="xapp-your-token"

# Run the bot
java -jar target/slack-bot.jar
```

Then mention the bot in Slack or send it a direct message!

See [slack-bot/README.md](slack-bot/README.md) for full setup instructions.

## Configuration

### Application Properties

The backend uses `application.properties` for configuration. Default settings work out of the box:
- SQLite database (auto-created)
- JWT secret (auto-generated)
- Ollama integration (llama3.2 model)

See `backend/src/main/resources/application.properties` for customization options.

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
├── backend/             # Spring Boot backend
│   ├── src/main/java/com/intelligence/assistant/
│   │   ├── connector/   # Data source connectors
│   │   ├── controller/  # REST controllers
│   │   ├── model/       # JPA entities
│   │   ├── service/     # Business logic
│   │   ├── security/    # JWT & authentication
│   │   └── config/      # Spring configuration
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   └── App.js
│   └── package.json
├── cli/                 # Command-line interface
│   ├── src/main/java/com/intelligence/assistant/cli/
│   ├── pom.xml
│   └── README.md
├── slack-bot/           # Slack bot integration
│   ├── src/main/java/com/intelligence/assistant/slackbot/
│   ├── pom.xml
│   └── README.md
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
mvn clean package
java -jar target/assistant-1.0.0.jar
```

**Frontend compilation errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Lombok compilation errors**
```bash
# Make sure you're using Java 21 or 25
java --version
# Rebuild with updated Lombok
cd backend
mvn clean compile
```

## Development

### What the Scripts Do

The startup scripts will automatically:
- Check prerequisites (Java, Maven, Node.js, Ollama)
- Build the Java application
- Download Ollama model (llama3.2)
- Start the services

### Manual Setup (Optional)

If you prefer manual setup:

**Backend:**
```bash
cd backend
mvn clean package -DskipTests
java -jar target/assistant-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Adding Custom Data Sources

1. Create connector in `backend/src/main/java/com/intelligence/assistant/connector/YourConnector.java`
2. Extend `BaseConnector` class
3. Implement `fetchDocuments()` method
4. Register in `DataSourceService.java`

## API Documentation

Complete API documentation is available:
- **Interactive Docs**: http://localhost:8000/swagger-ui/index.html (when backend is running)
- **OpenAPI Spec**: [backend/docs/openapi.yaml](backend/docs/openapi.yaml)
- **API Guide**: [backend/docs/README.md](backend/docs/README.md)

## Tech Stack

- **Backend**: Spring Boot 3.2.1, Spring Security, Hibernate
- **Frontend**: React, Tailwind CSS
- **AI**: Ollama (llama3.2), LangChain4j
- **Database**: SQLite with JPA/Hibernate
- **Auth**: JWT tokens, BCrypt encryption

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

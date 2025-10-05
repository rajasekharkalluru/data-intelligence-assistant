# Developer Intelligence Assistant - Slack Bot

Slack bot integration for the Developer Intelligence Assistant.

## Features

- 💬 Respond to direct messages
- 🏷️ Respond to @mentions in channels
- 🤖 Automatic user authentication
- 🔄 Real-time responses using Socket Mode

## Setup

### 1. Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "Developer Intelligence Assistant"
4. Select your workspace

### 2. Configure Bot Permissions

Go to "OAuth & Permissions" and add these Bot Token Scopes:
- `app_mentions:read` - Read messages that mention the bot
- `chat:write` - Send messages
- `im:read` - Read direct messages
- `im:write` - Send direct messages
- `im:history` - View message history in DMs

### 3. Enable Socket Mode

1. Go to "Socket Mode" in the sidebar
2. Enable Socket Mode
3. Generate an App-Level Token with `connections:write` scope
4. Save the token (starts with `xapp-`)

### 4. Enable Event Subscriptions

1. Go to "Event Subscriptions"
2. Enable Events
3. Subscribe to these bot events:
   - `app_mention` - When someone mentions the bot
   - `message.im` - Direct messages to the bot

### 5. Install to Workspace

1. Go to "Install App"
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

## Build

```bash
cd slack-bot
mvn clean package
```

This creates `target/slack-bot.jar`

## Configuration

Set these environment variables:

```bash
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
export SLACK_APP_TOKEN="xapp-your-app-token"
export BACKEND_API_URL="http://localhost:8000"  # Optional, defaults to localhost:8000
```

Or create a `.env` file:
```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
BACKEND_API_URL=http://localhost:8000
```

## Run

```bash
# With environment variables
java -jar target/slack-bot.jar

# Or with inline variables
SLACK_BOT_TOKEN=xoxb-... SLACK_APP_TOKEN=xapp-... java -jar target/slack-bot.jar
```

## Usage

### Direct Messages

Send a direct message to the bot:
```
How do I deploy the application?
```

The bot will respond with an answer from your knowledge base.

### Channel Mentions

Mention the bot in any channel:
```
@Developer Intelligence Assistant what are the coding standards?
```

### Commands

The bot responds to natural language questions. Just ask!

Examples:
- "What is the deployment process?"
- "How do I configure the database?"
- "Explain the authentication flow"
- "Where can I find the API documentation?"

## How It Works

1. **User Authentication**: The bot automatically creates/authenticates users based on their Slack user ID
2. **Query Processing**: Questions are sent to the backend API
3. **Response**: The bot sends the AI-generated answer back to Slack

## Troubleshooting

### Bot doesn't respond

1. Check that Socket Mode is enabled
2. Verify the tokens are correct
3. Ensure the bot is invited to the channel (for mentions)
4. Check the backend is running

### "Missing required environment variables"

Make sure both `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` are set.

### Connection errors

Verify the backend API URL is correct and the backend is running:
```bash
curl http://localhost:8000/health
```

## Development

### Build and Run
```bash
mvn clean package
java -jar target/slack-bot.jar
```

### Logs

The bot uses SLF4J for logging. Logs will show:
- Startup information
- Incoming messages
- Query processing
- Errors

## Requirements

- Java 21+
- Backend server running
- Slack workspace with admin access

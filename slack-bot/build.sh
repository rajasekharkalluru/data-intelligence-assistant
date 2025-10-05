#!/bin/bash

echo "🔨 Building Developer Intelligence Assistant Slack Bot..."

cd "$(dirname "$0")"

mvn clean package

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 JAR created: target/slack-bot.jar"
    echo ""
    echo "To run the bot, set these environment variables:"
    echo "  export SLACK_BOT_TOKEN='xoxb-your-bot-token'"
    echo "  export SLACK_APP_TOKEN='xapp-your-app-token'"
    echo "  export BACKEND_API_URL='http://localhost:8000'  # Optional"
    echo ""
    echo "Then run:"
    echo "  java -jar target/slack-bot.jar"
else
    echo "❌ Build failed!"
    exit 1
fi

#!/bin/bash

echo "🔨 Building Developer Intelligence Assistant CLI..."

cd "$(dirname "$0")"

mvn clean package

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 JAR created: target/dia-cli.jar"
    echo ""
    echo "To use the CLI, add this alias to your ~/.zshrc or ~/.bashrc:"
    echo "  alias dia='java -jar $(pwd)/target/dia-cli.jar'"
    echo ""
    echo "Or run directly:"
    echo "  java -jar target/dia-cli.jar --help"
else
    echo "❌ Build failed!"
    exit 1
fi

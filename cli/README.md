# Developer Intelligence Assistant - Java CLI

Command-line interface for the Developer Intelligence Assistant.

## Build

```bash
cd cli
mvn clean package
```

This creates `target/dia-cli.jar`

## Installation

### Option 1: Create an alias (Recommended)
```bash
# Add to your ~/.zshrc or ~/.bashrc
alias dia='java -jar /path/to/cli/target/dia-cli.jar'
```

### Option 2: Create a shell script
```bash
# Create /usr/local/bin/dia
#!/bin/bash
java -jar /path/to/cli/target/dia-cli.jar "$@"

# Make it executable
chmod +x /usr/local/bin/dia
```

## Usage

### Register
```bash
dia register
# Or with options
dia register -u username -e email@example.com -p password
```

### Login
```bash
dia login
# Or with options
dia login -u username -p password
```

### Ask Questions
```bash
dia ask "How do I deploy the application?"

# With response type
dia ask "Explain the architecture" -t expansive
```

### List Data Sources
```bash
dia sources
```

### Sync Data Source
```bash
dia sync 1
```

### Interactive Mode
```bash
dia interactive
```

This starts an interactive chat session where you can:
- Ask questions continuously
- Type `sources` to list data sources
- Type `help` for commands
- Type `exit` or `quit` to leave

### Logout
```bash
dia logout
```

## Configuration

The CLI stores authentication tokens in `~/.dia/token`

To use a different backend URL:
```bash
dia -u http://your-server:8000 login
```

## Examples

```bash
# Complete workflow
dia register
dia sources
dia ask "What are the deployment steps?"
dia interactive
```

## Requirements

- Java 21+
- Backend server running on http://localhost:8000 (or specify with -u)

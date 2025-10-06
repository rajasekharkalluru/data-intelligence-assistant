# Windows Setup Guide

Complete guide for setting up Data Intelligence Assistant on Windows.

## Prerequisites

### 1. Install Java 21+

**Option A: Eclipse Temurin (Recommended)**
1. Download from [Adoptium](https://adoptium.net/)
2. Choose "Temurin 21 (LTS)" → Windows → x64 → JDK
3. Run installer and check "Set JAVA_HOME" and "Add to PATH"
4. Verify installation:
   ```cmd
   java -version
   ```

**Option B: Oracle JDK**
1. Download from [Oracle](https://www.oracle.com/java/technologies/downloads/)
2. Install and add to PATH manually

### 2. Install Maven

1. Download from [Apache Maven](https://maven.apache.org/download.cgi)
2. Extract to `C:\Program Files\Apache\maven`
3. Add to PATH:
   - Open "Environment Variables"
   - Add `C:\Program Files\Apache\maven\bin` to PATH
4. Verify:
   ```cmd
   mvn -version
   ```

### 3. Install Node.js

1. Download from [nodejs.org](https://nodejs.org/)
2. Choose LTS version (18+)
3. Run installer (includes npm)
4. Verify:
   ```cmd
   node --version
   npm --version
   ```

### 4. Install Git (Optional but Recommended)

1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Install with default options
3. Verify:
   ```cmd
   git --version
   ```

### 5. Install Ollama (for Local AI)

1. Download from [ollama.ai/download/windows](https://ollama.ai/download/windows)
2. Run installer
3. Open Command Prompt and pull a model:
   ```cmd
   ollama pull llama3.2
   ```
4. Verify Ollama is running:
   ```cmd
   curl http://localhost:11434/api/tags
   ```

## Quick Start

### Option 1: Using Batch Files (Easiest)

1. **Clone the repository**
   ```cmd
   git clone <repository-url>
   cd data-intelligence-assistant
   ```

2. **Run diagnostics**
   ```cmd
   diagnose.bat
   ```

3. **Start backend** (in one Command Prompt)
   ```cmd
   cd backend
   run.bat
   ```

4. **Start frontend** (in another Command Prompt)
   ```cmd
   cd frontend
   npm install
   npm start
   ```

5. **Open browser**
   - Navigate to http://localhost:3000
   - Login with demo/demo123 or admin/admin123

### Option 2: Manual Setup

1. **Build backend**
   ```cmd
   cd backend
   mvn clean package -DskipTests
   ```

2. **Start backend**
   ```cmd
   java -jar target\assistant-1.0.0.jar
   ```

3. **Install frontend dependencies** (in new Command Prompt)
   ```cmd
   cd frontend
   npm install
   ```

4. **Start frontend**
   ```cmd
   npm start
   ```

## Configuration

### Environment Variables (Windows)

**Option A: Set temporarily (current session)**
```cmd
set AI_PROVIDER=local
set OLLAMA_BASE_URL=http://localhost:11434
```

**Option B: Set permanently (system-wide)**
1. Open "Environment Variables" (Win + Pause → Advanced → Environment Variables)
2. Add new variables:
   - `AI_PROVIDER` = `local`
   - `OLLAMA_BASE_URL` = `http://localhost:11434`

**Option C: Use .env file**
1. Copy `backend\.env.example` to `backend\.env`
2. Edit values as needed
3. Backend will load automatically

### Using OCI on Windows

1. **Install OCI CLI**
   ```powershell
   # Using PowerShell
   Invoke-WebRequest -Uri https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1 -OutFile install.ps1
   .\install.ps1
   ```

2. **Configure OCI**
   ```cmd
   oci setup config
   ```
   This creates `%USERPROFILE%\.oci\config`

3. **Set environment variable**
   ```cmd
   set AI_PROVIDER=oci
   set OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-id
   ```

4. **Restart backend**

See [backend/OCI_SETUP.md](backend/OCI_SETUP.md) for detailed OCI configuration.

## Common Issues

### Issue: "Java not found"
**Solution:**
1. Verify Java is installed: `java -version`
2. Add Java to PATH:
   - Find Java installation (e.g., `C:\Program Files\Eclipse Adoptium\jdk-21.0.1.12-hotspot\bin`)
   - Add to PATH in Environment Variables
3. Restart Command Prompt

### Issue: "Maven not found"
**Solution:**
1. Download Maven from apache.org
2. Extract to `C:\Program Files\Apache\maven`
3. Add `C:\Program Files\Apache\maven\bin` to PATH
4. Restart Command Prompt

### Issue: "Port 8000 already in use"
**Solution:**
```cmd
REM Find process using port 8000
netstat -ano | findstr :8000

REM Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Ollama not accessible"
**Solution:**
1. Check if Ollama is running:
   - Look for Ollama icon in system tray
   - Or check Task Manager for "ollama" process
2. Restart Ollama:
   - Right-click system tray icon → Quit
   - Start Ollama from Start Menu
3. Verify: `curl http://localhost:11434/api/tags`

### Issue: "npm install fails"
**Solution:**
```cmd
REM Clear npm cache
npm cache clean --force

REM Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

REM Reinstall
npm install
```

### Issue: "Cannot find sqlite3"
**Solution:**
SQLite is embedded in the Java application, no separate installation needed.
The database file is auto-created at `backend\data\intelligence.db`

## Development Tools (Optional)

### Visual Studio Code
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install extensions:
   - Java Extension Pack
   - Spring Boot Extension Pack
   - ES7+ React/Redux/React-Native snippets

### IntelliJ IDEA
1. Download Community Edition from [jetbrains.com](https://www.jetbrains.com/idea/download/)
2. Open project folder
3. Maven dependencies will auto-import

### Database Browser
**DB Browser for SQLite:**
1. Download from [sqlitebrowser.org](https://sqlitebrowser.org/dl/)
2. Install and open `backend\data\intelligence.db`

## PowerShell Alternative

If you prefer PowerShell over Command Prompt:

```powershell
# Navigate to project
cd data-intelligence-assistant

# Build backend
cd backend
mvn clean package -DskipTests

# Start backend (in new PowerShell window)
java -jar target\assistant-1.0.0.jar

# Start frontend (in another PowerShell window)
cd ..\frontend
npm install
npm start
```

## Firewall Configuration

If you have issues accessing the application:

1. **Allow Java through Windows Firewall:**
   - Windows Security → Firewall & network protection
   - Allow an app through firewall
   - Add Java (java.exe)

2. **Allow Node.js through Windows Firewall:**
   - Same steps as above
   - Add Node.js (node.exe)

## Performance Tips

1. **Exclude from Windows Defender:**
   - Add project folder to exclusions
   - Speeds up Maven builds and npm installs

2. **Use SSD:**
   - Place project on SSD for faster builds

3. **Increase Java Memory:**
   ```cmd
   set MAVEN_OPTS=-Xmx2048m
   mvn clean package
   ```

## Troubleshooting Commands

```cmd
REM Check what's running on ports
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :11434

REM Check Java processes
tasklist | findstr java

REM Check Node processes
tasklist | findstr node

REM View backend logs
type backend\app.log

REM Run diagnostics
diagnose.bat
```

## Next Steps

1. ✅ Complete setup using this guide
2. ✅ Run `diagnose.bat` to verify everything works
3. ✅ Start backend and frontend
4. ✅ Access http://localhost:3000
5. ✅ Login with demo/demo123
6. 📚 Read [README.md](README.md) for features and usage
7. 🔧 Configure data sources in the UI

## Getting Help

- Check [README.md](README.md) for general documentation
- See [backend/OCI_SETUP.md](backend/OCI_SETUP.md) for OCI configuration
- Run `diagnose.bat` to identify issues
- Check logs in `backend\app.log`

## Uninstallation

To remove the application:

1. Stop all running processes (Ctrl+C in Command Prompts)
2. Delete project folder
3. Optionally remove:
   - Java (if not needed for other projects)
   - Maven (if not needed)
   - Node.js (if not needed)
   - Ollama (if not needed)

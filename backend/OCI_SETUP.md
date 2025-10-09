# OCI Generative AI Setup Guide

Complete step-by-step guide to set up Oracle Cloud Infrastructure (OCI) Generative AI services and connect them to your Data Intelligence Assistant application.

## Part 1: OCI Account Setup

### Step 1: Create OCI Account (If Not Done)

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Click "Start for free"
3. Fill in your details and verify email
4. You'll get:
   - $300 free credits for 30 days
   - Always Free services (including some AI services)

### Step 2: Access OCI Console

1. Go to [cloud.oracle.com](https://cloud.oracle.com/)
2. Enter your Cloud Account Name (tenancy name)
3. Click "Continue"
4. Sign in with your credentials
5. You'll land on the OCI Console dashboard

### Step 3: Create or Select a Compartment

**What is a Compartment?**
A compartment is a logical container for organizing cloud resources.

**Create a new compartment:**
1. In OCI Console, click hamburger menu (☰) → **Identity & Security** → **Compartments**
2. Click **Create Compartment**
3. Fill in:
   - **Name**: `dia-compartment` (or your preferred name)
   - **Description**: "Data Intelligence Assistant resources"
   - **Parent Compartment**: Select root or existing compartment
4. Click **Create Compartment**
5. **Copy the OCID** (looks like `ocid1.compartment.oc1..aaaaaa...`)
   - You'll need this later!

### Step 4: Enable Generative AI Service

1. In OCI Console, click hamburger menu (☰) → **Analytics & AI** → **Generative AI**
2. If prompted, click **Enable Service**
3. Select your region (recommended: **US Midwest (Chicago)**)
4. Wait for service to be enabled (usually instant)

### Step 5: Check Available Models

1. In Generative AI console, click **Models** in left menu
2. You should see available models:
   - **Cohere Command R+** (Recommended - most capable)
   - **Meta Llama 3 70B Instruct**
   - **Cohere Command R 16K**
3. Note: Some models may require requesting access

## Part 2: Configure API Access

### Step 6: Generate API Signing Keys

**Option A: Using OCI Console (Easiest)**

1. Click your **Profile icon** (top right) → **User Settings**
2. Scroll down to **Resources** → Click **API Keys**
3. Click **Add API Key**
4. Select **Generate API Key Pair**
5. Click **Download Private Key** (saves as `*.pem` file)
6. Click **Download Public Key** (optional, for backup)
7. Click **Add**
8. **Copy the Configuration File Preview** - you'll need this!

**Option B: Using Command Line**

```bash
# Create .oci directory
mkdir -p ~/.oci

# Generate private key
openssl genrsa -out ~/.oci/oci_api_key.pem 2048

# Set permissions
chmod 600 ~/.oci/oci_api_key.pem

# Generate public key
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
```

Then upload the public key in OCI Console (User Settings → API Keys → Add API Key → Paste Public Key)

### Step 7: Create OCI Config File

1. Create/edit `~/.oci/config` file:

**macOS/Linux:**
```bash
mkdir -p ~/.oci
nano ~/.oci/config
```

**Windows:**
```cmd
mkdir %USERPROFILE%\.oci
notepad %USERPROFILE%\.oci\config
```

2. Paste the configuration from Step 6 (or create manually):

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaxxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaxxxxx
region=us-chicago-1
key_file=~/.oci/oci_api_key.pem
```

3. Replace values with your actual OCIDs from the console

**Where to find these values:**
- **user**: Profile icon → User Settings → Copy OCID
- **fingerprint**: Shown when you added the API key
- **tenancy**: Profile icon → Tenancy → Copy OCID
- **region**: Your selected region (e.g., `us-chicago-1`)
- **key_file**: Path to your private key file

4. Save the file

5. Set permissions (macOS/Linux):
```bash
chmod 600 ~/.oci/config
chmod 600 ~/.oci/oci_api_key.pem
```

## Part 3: Configure Your Application

### Step 8: Set Environment Variables

**Option A: Using .env file (Recommended)**

1. Navigate to your project:
```bash
cd data-intelligence-assistant/backend
```

2. Copy the example file:
```bash
cp .env.example .env
```

3. Edit `.env` file:
```bash
# Set AI Provider to OCI
AI_PROVIDER=oci

# OCI Configuration
OCI_CONFIG_FILE=~/.oci/config
OCI_PROFILE=DEFAULT
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id-from-step-3

# OCI Generative AI
OCI_GENAI_ENDPOINT=https://inference.generativeai.us-chicago-1.oci.oraclecloud.com
OCI_MODEL_ID=cohere.command-r-plus

# OCI Embedding
OCI_EMBEDDING_ENDPOINT=https://inference.generativeai.us-chicago-1.oci.oraclecloud.com
OCI_EMBEDDING_MODEL_ID=cohere.embed-english-v3.0
```

4. Replace `OCI_COMPARTMENT_ID` with your compartment OCID from Step 3

**Option B: Using Environment Variables**

**macOS/Linux:**
```bash
export AI_PROVIDER=oci
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id
export OCI_MODEL_ID=cohere.command-r-plus
```

**Windows:**
```cmd
set AI_PROVIDER=oci
set OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id
set OCI_MODEL_ID=cohere.command-r-plus
```

### Step 9: Install OCI CLI (Optional but Recommended)

**macOS/Linux:**
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1 -OutFile install.ps1
.\install.ps1
```

**Verify installation:**
```bash
oci --version
```

**Configure OCI CLI:**
```bash
oci setup config
```
This will guide you through creating the config file.

## Part 4: Test the Connection

### Step 10: Test OCI Configuration

**Test with OCI CLI:**
```bash
# Test authentication
oci iam region list

# Test Generative AI access
oci generative-ai model list --compartment-id <your-compartment-id>
```

If these commands work, your OCI configuration is correct!

### Step 11: Start Your Application

1. **Build the backend:**
```bash
cd backend
mvn clean package -DskipTests
```

2. **Start the backend:**
```bash
java -jar target/assistant-1.0.0.jar
```

Or on Windows:
```cmd
cd backend
run.bat
```

3. **Check the logs:**
Look for:
```
Fetching available models from oci provider
```

4. **Test the models endpoint:**
```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}' | jq -r '.accessToken')

# Check models
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/models
```

Should return:
```json
{
  "models": [
    {"name": "cohere.command-r-plus", "size": "Cloud"},
    {"name": "meta.llama-3-70b-instruct", "size": "Cloud"}
  ],
  "provider": "oci",
  "available": true
}
```

### Step 12: Test Chat with OCI

1. Start frontend:
```bash
cd frontend
npm start
```

2. Open http://localhost:3000
3. Login with `demo`/`demo123`
4. Ask a question in the chat
5. The response will come from OCI Generative AI!

## Part 5: Available Models and Configuration

### Available OCI Models

### Chat Models

| Model ID | Description | Best For |
|----------|-------------|----------|
| `cohere.command-r-plus` | Most capable model | Complex reasoning, long context |
| `meta.llama-3-70b-instruct` | Open source alternative | General purpose |
| `cohere.command-r-16k` | Faster, lighter model | Quick responses |

### Embedding Models

| Model ID | Description |
|----------|-------------|
| `cohere.embed-english-v3.0` | English embeddings |
| `cohere.embed-multilingual-v3.0` | Multilingual support |

## Step 5: OCI Regions

Available regions for Generative AI:

- **US Chicago**: `us-chicago-1` (Recommended)
- **US East**: `us-ashburn-1`
- **Frankfurt**: `eu-frankfurt-1`

Update the endpoint based on your region:
```
https://inference.generativeai.<region>.oci.oraclecloud.com
```

## Step 6: Test Configuration

1. Start the backend:
   ```bash
   cd backend
   ./run.sh
   ```

2. Check the logs for:
   ```
   Fetching available models from oci provider
   ```

3. Test the models endpoint:
   ```bash
   curl http://localhost:8000/models
   ```

   Should return:
   ```json
   {
     "models": [...],
     "provider": "oci",
     "available": true
   }
   ```

## Step 7: Switch Back to Local

To switch back to local Ollama:

1. Update `.env`:
   ```bash
   AI_PROVIDER=local
   ```

2. Restart the backend

## Troubleshooting

### "OCI credentials not configured"

- Verify `~/.oci/config` exists and is readable
- Check file permissions: `chmod 600 ~/.oci/config`
- Verify compartment OCID is correct

### "Authentication failed"

- Verify API key fingerprint matches in OCI Console
- Check key file path in config
- Ensure key file has correct permissions: `chmod 600 ~/.oci/oci_api_key.pem`

### "Service not available"

- Check if Generative AI is available in your region
- Verify endpoint URL matches your region
- Check OCI service limits and quotas

### "Model not found"

- Verify model ID is correct (case-sensitive)
- Check if model is available in your region
- Some models may require special access

## Cost Considerations

OCI Generative AI pricing (as of 2024):

- **Cohere Command R+**: ~$0.015 per 1K tokens
- **Llama 3 70B**: ~$0.01 per 1K tokens
- **Embeddings**: ~$0.0001 per 1K tokens

Monitor usage in OCI Console → Cost Management

## Production Recommendations

1. **Use OCI SDK**: For production, integrate the official OCI Java SDK for proper request signing
2. **Enable Logging**: Set up OCI logging for API calls
3. **Set Quotas**: Configure service limits to control costs
4. **Use Secrets**: Store credentials in OCI Vault instead of config files
5. **Monitor Usage**: Set up billing alerts and usage tracking

## Additional Resources

- [OCI Generative AI Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/home.htm)
- [OCI Java SDK](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/javasdk.htm)
- [OCI CLI Setup](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm)
- [API Key Setup](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm)

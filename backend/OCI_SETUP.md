# OCI Generative AI Setup Guide

This guide explains how to configure the Data Intelligence Assistant to use Oracle Cloud Infrastructure (OCI) Generative AI services instead of local Ollama.

## Prerequisites

1. **OCI Account**: Active Oracle Cloud Infrastructure account
2. **OCI CLI**: Installed and configured (optional but recommended)
3. **Compartment**: Access to a compartment where you can use Generative AI services
4. **API Keys**: OCI API signing keys configured

## Step 1: Configure OCI Credentials

### Option A: Using OCI CLI (Recommended)

1. Install OCI CLI:
   ```bash
   bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
   ```

2. Configure OCI CLI:
   ```bash
   oci setup config
   ```
   
   This will create `~/.oci/config` with your credentials.

### Option B: Manual Configuration

Create `~/.oci/config` file:

```ini
[DEFAULT]
user=ocid1.user.oc1..your-user-ocid
fingerprint=your-key-fingerprint
tenancy=ocid1.tenancy.oc1..your-tenancy-ocid
region=us-chicago-1
key_file=~/.oci/oci_api_key.pem
```

Generate API signing key:
```bash
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
```

Upload the public key to OCI Console:
1. Go to User Settings → API Keys
2. Click "Add API Key"
3. Upload `~/.oci/oci_api_key_public.pem`

## Step 2: Get Your Compartment OCID

1. Log in to OCI Console
2. Navigate to Identity → Compartments
3. Find your compartment and copy its OCID
4. It looks like: `ocid1.compartment.oc1..aaaaaaaxxxxx`

## Step 3: Configure Application

### Using Environment Variables

Create or update `backend/.env`:

```bash
# Set AI Provider to OCI
AI_PROVIDER=oci

# OCI Configuration
OCI_CONFIG_FILE=~/.oci/config
OCI_PROFILE=DEFAULT
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id

# OCI Generative AI
OCI_GENAI_ENDPOINT=https://inference.generativeai.us-chicago-1.oci.oraclecloud.com
OCI_MODEL_ID=cohere.command-r-plus

# OCI Embedding
OCI_EMBEDDING_ENDPOINT=https://inference.generativeai.us-chicago-1.oci.oraclecloud.com
OCI_EMBEDDING_MODEL_ID=cohere.embed-english-v3.0
```

### Using application.yml

Alternatively, edit `backend/src/main/resources/application.yml`:

```yaml
app:
  ai:
    provider: oci
  
  oci:
    config-file: ~/.oci/config
    profile: DEFAULT
    generative-ai:
      endpoint: https://inference.generativeai.us-chicago-1.oci.oraclecloud.com
      compartment-id: ocid1.compartment.oc1..your-compartment-id
      model-id: cohere.command-r-plus
```

## Step 4: Available OCI Models

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

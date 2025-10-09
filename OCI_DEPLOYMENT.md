# Deploying to Oracle Cloud Infrastructure (OCI)

Complete guide to deploy your Data Intelligence Assistant application to Oracle Cloud Infrastructure.

## Deployment Options

1. **Compute Instance (VM)** - Traditional VM deployment (Easiest)
2. **Container Instances** - Serverless containers
3. **Kubernetes (OKE)** - For production scale
4. **Functions** - Serverless functions (Advanced)

This guide covers **Option 1: Compute Instance** as it's the most straightforward.

## Part 1: Create Compute Instance

### Step 1: Navigate to Compute

1. Log in to [OCI Console](https://cloud.oracle.com/)
2. Click hamburger menu (☰) → **Compute** → **Instances**
3. Make sure you're in the correct compartment (top left dropdown)

### Step 2: Create Instance

1. Click **Create Instance**

2. **Name your instance:**
   - Name: `dia-server` (or your preferred name)

3. **Placement:**
   - Availability Domain: Select any (usually AD-1)
   - Fault Domain: Leave default

4. **Image and Shape:**
   - **Image**: Click "Change Image"
     - Select **Oracle Linux 8** (recommended) or **Ubuntu 22.04**
     - Click "Select Image"
   
   - **Shape**: Click "Change Shape"
     - **For Free Tier**: Select **VM.Standard.E2.1.Micro** (Always Free)
     - **For Better Performance**: Select **VM.Standard.E4.Flex**
       - OCPUs: 2
       - Memory: 16 GB
     - Click "Select Shape"

5. **Networking:**
   - **Virtual Cloud Network**: Select existing or create new
   - **Subnet**: Select public subnet
   - **Public IP**: Select "Assign a public IPv4 address"
   - **Use network security groups**: Leave unchecked

6. **Add SSH Keys:**
   - **Generate SSH key pair** (recommended)
     - Click "Save Private Key" - downloads `ssh-key-*.key`
     - Click "Save Public Key" (optional)
   - Or paste your existing public key

7. **Boot Volume:**
   - Leave defaults (50 GB is sufficient)

8. Click **Create**

9. Wait for instance to be in **Running** state (1-2 minutes)

10. **Copy the Public IP Address** - you'll need this!

### Step 3: Configure Security Rules

1. On the instance details page, click the **Subnet** link
2. Click the **Default Security List**
3. Click **Add Ingress Rules**

**Add these rules:**

**Rule 1: HTTP (Frontend)**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `3000`
- Description: Frontend access

**Rule 2: API (Backend)**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `8000`
- Description: Backend API access

**Rule 3: HTTPS (Optional, for production)**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `443`
- Description: HTTPS access

4. Click **Add Ingress Rules**

## Part 2: Connect and Setup Server

### Step 4: Connect to Instance

**macOS/Linux:**
```bash
# Set permissions on private key
chmod 400 ~/Downloads/ssh-key-*.key

# Connect to instance
ssh -i ~/Downloads/ssh-key-*.key opc@<PUBLIC_IP>
```

**Windows (using PuTTY):**
1. Download [PuTTY](https://www.putty.org/)
2. Convert key using PuTTYgen (Load private key → Save as .ppk)
3. In PuTTY:
   - Host: `opc@<PUBLIC_IP>`
   - Connection → SSH → Auth → Browse to .ppk file
   - Click Open

### Step 5: Install Prerequisites

Once connected to the instance:

```bash
# Update system
sudo yum update -y

# Install Java 21
sudo yum install -y java-21-openjdk java-21-openjdk-devel

# Verify Java
java -version

# Install Maven
sudo yum install -y maven

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installations
node --version
npm --version
mvn --version

# Install Git
sudo yum install -y git

# Install Ollama (if using local AI)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2
```

### Step 6: Clone and Build Application

```bash
# Clone your repository
git clone <your-repo-url>
cd data-intelligence-assistant

# Build backend
cd backend
mvn clean package -DskipTests

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend for production
npm run build
```

## Part 3: Configure Application

### Step 7: Set Up Environment Variables

```bash
# Create .env file
cd ~/data-intelligence-assistant/backend
nano .env
```

**For Local Ollama:**
```bash
AI_PROVIDER=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
JWT_SECRET=your-production-secret-change-this
ENCRYPTION_KEY=your-encryption-key-change-this
```

**For OCI Generative AI:**
```bash
AI_PROVIDER=oci
OCI_CONFIG_FILE=/home/opc/.oci/config
OCI_PROFILE=DEFAULT
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id
OCI_MODEL_ID=cohere.command-r-plus
JWT_SECRET=your-production-secret-change-this
ENCRYPTION_KEY=your-encryption-key-change-this
```

Save and exit (Ctrl+X, Y, Enter)

### Step 8: Configure OCI Credentials (if using OCI AI)

```bash
# Create OCI config directory
mkdir -p ~/.oci

# Create config file
nano ~/.oci/config
```

Paste your OCI configuration:
```ini
[DEFAULT]
user=ocid1.user.oc1..your-user-ocid
fingerprint=your-fingerprint
tenancy=ocid1.tenancy.oc1..your-tenancy-ocid
region=us-chicago-1
key_file=/home/opc/.oci/oci_api_key.pem
```

```bash
# Create private key file
nano ~/.oci/oci_api_key.pem
```

Paste your private key content, then:
```bash
# Set permissions
chmod 600 ~/.oci/config
chmod 600 ~/.oci/oci_api_key.pem
```

## Part 4: Run Application

### Step 9: Start Backend

**Option A: Run in foreground (for testing)**
```bash
cd ~/data-intelligence-assistant/backend
java -jar target/assistant-1.0.0.jar
```

**Option B: Run as background service (recommended)**

Create systemd service:
```bash
sudo nano /etc/systemd/system/dia-backend.service
```

Paste:
```ini
[Unit]
Description=Data Intelligence Assistant Backend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/home/opc/data-intelligence-assistant/backend
ExecStart=/usr/bin/java -jar /home/opc/data-intelligence-assistant/backend/target/assistant-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dia-backend
sudo systemctl start dia-backend

# Check status
sudo systemctl status dia-backend

# View logs
sudo journalctl -u dia-backend -f
```

### Step 10: Start Frontend

**Option A: Using serve (simple)**
```bash
# Install serve globally
sudo npm install -g serve

# Serve the built frontend
cd ~/data-intelligence-assistant/frontend
serve -s build -l 3000
```

**Option B: Using systemd service (recommended)**

Create service:
```bash
sudo nano /etc/systemd/system/dia-frontend.service
```

Paste:
```ini
[Unit]
Description=Data Intelligence Assistant Frontend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/home/opc/data-intelligence-assistant/frontend
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dia-frontend
sudo systemctl start dia-frontend
sudo systemctl status dia-frontend
```

### Step 11: Configure Firewall

```bash
# Open ports in OS firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

## Part 5: Access Your Application

### Step 12: Test Access

1. **Frontend**: http://`<PUBLIC_IP>`:3000
2. **Backend API**: http://`<PUBLIC_IP>`:8000
3. **API Docs**: http://`<PUBLIC_IP>`:8000/swagger-ui/index.html

### Step 13: Set Up Domain (Optional)

**Using OCI DNS:**

1. In OCI Console → **Networking** → **DNS Management**
2. Create a DNS Zone for your domain
3. Add A records:
   - `dia.yourdomain.com` → `<PUBLIC_IP>`
   - `api.yourdomain.com` → `<PUBLIC_IP>`
4. Update your domain's nameservers to OCI nameservers

**Update CORS in backend:**
```bash
nano ~/data-intelligence-assistant/backend/src/main/resources/application.yml
```

Update:
```yaml
cors:
  allowed-origins: http://dia.yourdomain.com,https://dia.yourdomain.com
```

Rebuild and restart backend.

## Part 6: Production Enhancements

### Step 14: Set Up HTTPS with Let's Encrypt

```bash
# Install Nginx
sudo yum install -y nginx

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d dia.yourdomain.com -d api.yourdomain.com

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/conf.d/dia.conf
```

Paste:
```nginx
# Frontend
server {
    listen 80;
    server_name dia.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name dia.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/dia.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dia.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/dia.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dia.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Step 15: Set Up Monitoring

**Enable OCI Monitoring:**
1. OCI Console → **Observability & Management** → **Monitoring**
2. Create alarm for CPU/Memory usage
3. Set up notifications

**Application logs:**
```bash
# View backend logs
sudo journalctl -u dia-backend -f

# View frontend logs
sudo journalctl -u dia-frontend -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Step 16: Set Up Backups

```bash
# Backup database
cp ~/data-intelligence-assistant/backend/data/intelligence.db ~/backups/intelligence-$(date +%Y%m%d).db

# Create backup script
nano ~/backup.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp ~/data-intelligence-assistant/backend/data/intelligence.db $BACKUP_DIR/intelligence-$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "intelligence-*.db" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add:
```
0 2 * * * /home/opc/backup.sh >> /home/opc/backup.log 2>&1
```

## Part 7: Scaling and High Availability

### Option: Load Balancer (For Production)

1. **Create Load Balancer:**
   - OCI Console → **Networking** → **Load Balancers**
   - Create Load Balancer
   - Add backend set with your instance
   - Configure health checks

2. **Create Multiple Instances:**
   - Clone your instance
   - Add to load balancer backend set
   - Use shared database (upgrade to MySQL/PostgreSQL)

### Option: Use OCI Database Service

Instead of SQLite, use managed database:

1. **Create Autonomous Database:**
   - OCI Console → **Oracle Database** → **Autonomous Database**
   - Create Always Free tier database
   - Download wallet
   - Update application.yml with connection details

## Troubleshooting

**Can't connect to instance:**
- Check security list rules
- Verify public IP
- Check SSH key permissions

**Application won't start:**
```bash
# Check Java
java -version

# Check logs
sudo journalctl -u dia-backend -n 50

# Check ports
sudo netstat -tulpn | grep -E '3000|8000'
```

**Out of memory:**
```bash
# Increase Java heap
ExecStart=/usr/bin/java -Xmx2g -jar /home/opc/data-intelligence-assistant/backend/target/assistant-1.0.0.jar
```

**OCI AI not working:**
```bash
# Test OCI CLI
oci iam region list

# Check credentials
cat ~/.oci/config
ls -la ~/.oci/
```

## Cost Optimization

**Free Tier Resources:**
- 2 VM.Standard.E2.1.Micro instances (Always Free)
- 10 TB outbound data transfer per month
- 2 Block Volumes (100 GB total)
- Autonomous Database (20 GB)

**Tips:**
- Use Always Free tier for development
- Stop instances when not in use
- Use OCI Generative AI (pay per use) instead of running Ollama
- Monitor usage in Cost Management

## Next Steps

1. ✅ Set up monitoring and alerts
2. ✅ Configure automated backups
3. ✅ Set up HTTPS with custom domain
4. ✅ Implement CI/CD pipeline
5. ✅ Scale horizontally with load balancer
6. ✅ Migrate to managed database for production

## Support

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [OCI Free Tier](https://www.oracle.com/cloud/free/)
- [OCI Support](https://www.oracle.com/support/)

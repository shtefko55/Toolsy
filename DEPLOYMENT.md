# 🚀 Deployment Guide - Retro Web Portal 98

This guide will help you deploy the Retro Web Portal 98 to your VPS using Docker.

## 📋 Prerequisites

- A VPS (Virtual Private Server) with Ubuntu/Debian/CentOS
- SSH access to your VPS
- Domain name (optional, but recommended)

## 🛠️ Step-by-Step Deployment

### Step 1: Prepare Your VPS

1. **Connect to your VPS via SSH:**
   ```bash
   ssh root@your-server-ip
   # or
   ssh your-username@your-server-ip
   ```

2. **Update system packages:**
   ```bash
   # For Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # For CentOS/RHEL
   sudo yum update -y
   ```

3. **Install Docker:**
   ```bash
   # For Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $(whoami)
   
   # For CentOS/RHEL
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $(whoami)
   ```

4. **Install Docker Compose:**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

5. **Install Git and other utilities:**
   ```bash
   # For Ubuntu/Debian
   sudo apt install -y git curl
   
   # For CentOS/RHEL
   sudo yum install -y git curl
   ```

6. **Logout and login again** (to apply Docker group changes):
   ```bash
   exit
   ssh root@69.62.115.146
   ```

### Step 2: Deploy the Application

1. **Clone the repository:**
   ```bash
   git https://github.com/shtefko55/Toolzi.git>
   cd retro-web-portal-98
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

   This script will:
   - Stop any existing containers
   - Build the Docker image
   - Start the application container
   - Check if the deployment was successful

### Step 3: Configure Firewall (if needed)

1. **Allow HTTP traffic:**
   ```bash
   # For Ubuntu/Debian (UFW)
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable
   
   # For CentOS/RHEL (firewalld)
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --reload
   ```

### Step 4: Set Up Domain (Optional)

1. **Point your domain to your VPS IP:**
   - Create an A record in your DNS settings
   - Point it to your VPS IP address

2. **Set up SSL with Let's Encrypt (Recommended):**
   ```bash
   # Install Certbot
   sudo apt install -y certbot python3-certbot-nginx
   
   # Stop the current container
   docker-compose down
   
   # Install Nginx on host
   sudo apt install -y nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d http://69.62.115.146/
   
   # Update nginx configuration for SSL
   # Then restart with SSL-enabled docker-compose
   ```

## 🔧 Manual Deployment (Alternative)

If you prefer manual deployment without the script:

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check if it's running:**
   ```bash
   docker-compose ps
   curl http://localhost/health
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## 🌐 Accessing Your Application

- **HTTP:** `http://your-server-ip` or `http://your-domain.com`
- **Health Check:** `http://your-server-ip/health`

## 📊 Monitoring and Maintenance

### Check Application Status
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check health
curl http://localhost/health
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Backup and Restore
```bash
# Backup (if you have data volumes)
docker-compose exec retro-web-portal tar czf /tmp/backup.tar.gz /usr/share/nginx/html

# Stop containers
docker-compose down

# Remove old images (optional)
docker image prune -f
```

## 🔒 Security Recommendations

1. **Use a reverse proxy (recommended):**
   - Set up Nginx or Traefik as a reverse proxy
   - Enable SSL/TLS certificates
   - Add rate limiting

2. **Firewall configuration:**
   - Only allow necessary ports (80, 443, 22)
   - Consider changing SSH port from default 22

3. **Regular updates:**
   - Keep your VPS system updated
   - Update Docker images regularly
   - Monitor security advisories

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using port 80
   sudo netstat -tulpn | grep :80
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Docker permission denied:**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $(whoami)
   # Logout and login again
   ```

3. **Application not starting:**
   ```bash
   # Check logs
   docker-compose logs
   
   # Check container status
   docker-compose ps
   ```

4. **Build fails:**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild
   docker-compose build --no-cache
   ```

### Useful Commands

```bash
# Restart application
docker-compose restart

# Update and redeploy
git pull && docker-compose up -d --build

# Clean up unused Docker resources
docker system prune -a

# View real-time logs
docker-compose logs -f

# Access container shell
docker-compose exec retro-web-portal sh
```

## 📈 Performance Optimization

1. **Enable Gzip compression** (already configured in nginx.conf)
2. **Set up CDN** for static assets
3. **Monitor resource usage:**
   ```bash
   docker stats
   ```

## 🎉 Success!

Your Retro Web Portal 98 should now be running on your VPS! 

Visit your server IP or domain to see the nostalgic Windows 98 interface with all the PDF and text tools working perfectly.

---

For any issues or questions, check the logs with `docker-compose logs` or review the troubleshooting section above. 
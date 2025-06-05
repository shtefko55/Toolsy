#!/bin/bash

# Retro Web Portal 98 - Deployment Script
set -e

echo "🚀 Starting deployment of Retro Web Portal 98..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down || true

# Remove old images (optional - uncomment to save space)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# docker image prune -f

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 10

# Check if the application is running
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Application is running at: http://$(curl -s ifconfig.me || echo 'your-server-ip')${NC}"
    echo -e "${GREEN}🏥 Health check: http://$(curl -s ifconfig.me || echo 'your-server-ip')/health${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check logs with: docker-compose logs${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Retro Web Portal 98 is now live!${NC}" 
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Start Docker
print_step "Starting Docker service"
sudo systemctl start docker
print_success "Docker service started"

# Build and start all containers
print_step "Building and starting all containers"
sudo docker compose up -d --build
print_success "All containers started"

echo ""
print_success "Application is ready!"
echo -e "${GREEN}🌐 Open http://localhost in your browser${NC}"
echo -e "${BLUE}ℹ️  Ollama may still be pulling the model in the background. Check with: docker logs ollama${NC}"
#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Detect and configure distro with user input
configure_distro() {
    echo -e "${BLUE}Select your Linux distribution:${NC}"
    echo "1) Ubuntu"
    echo "2) Debian"
    echo "3) Other Debian-based (Kali, etc.)"
    read -p "Enter your choice (1/2/3): " -r DISTRO_CHOICE
    
    case $DISTRO_CHOICE in
        1)
            DISTRO="ubuntu"
            DISTRO_NAME="Ubuntu"
            REPO_BASE="https://download.docker.com/linux/ubuntu"
            # Evaluate the command to get the actual codename
            CODENAME=$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
            print_success "Ubuntu selected - using UBUNTU_CODENAME with fallback to VERSION_CODENAME"
            print_success "Detected codename: $CODENAME"
            ;;
        2)
            DISTRO="debian"
            DISTRO_NAME="Debian"
            REPO_BASE="https://download.docker.com/linux/debian"
            # Evaluate the command to get the actual codename
            CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
            print_success "Debian selected - using VERSION_CODENAME"
            print_success "Detected codename: $CODENAME"
            ;;
        3)
            DISTRO="other"
            DISTRO_NAME="Debian-based"
            REPO_BASE="https://download.docker.com/linux/debian"
            echo -e "${YELLOW}Common Debian versions: bookworm, bullseye, buster${NC}"
            read -p "Enter the Debian version codename you want to use: " -r CODENAME
            print_success "Using custom codename: $CODENAME"
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac
}

# Step 1: Ask about removing old Docker versions
print_step "Removing old Docker versions"
read -p "Do you want to remove old Docker versions? (y/n): " -r REMOVE_OLD
if [[ $REMOVE_OLD =~ ^[Yy]$ ]]; then
    print_warning "Removing old Docker versions..."
    sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc 2>/dev/null | cut -f1) 2>/dev/null || true
    print_success "Old Docker versions removed (or not found)"
else
    print_warning "Skipping removal of old Docker versions"
fi

# Step 2: Ask about distro FIRST (before apt setup)
print_step "Configuring Linux distribution"
configure_distro
echo -e "Selected: ${GREEN}$DISTRO_NAME${NC}"

# Step 3: Ask about updating apt
print_step "Setting up repository"
read -p "Do you want to update and set up apt repositories? (y/n): " -r UPDATE_APT
if [[ $UPDATE_APT =~ ^[Yy]$ ]]; then
    print_warning "Updating apt and installing dependencies..."
    sudo apt update
    sudo apt install -y ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    print_success "Repository setup dependencies installed"
else
    print_warning "Skipping apt update and dependency installation"
fi

# Add the repository to Apt sources
if [[ $UPDATE_APT =~ ^[Yy]$ ]]; then
    print_warning "Adding Docker repository..."
    sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: $REPO_BASE
Suites: $CODENAME
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
    
    sudo apt update
    print_success "Docker repository added and apt updated"
fi

# Installing Docker Engine
print_step "Installing Docker Engine"
if [[ $UPDATE_APT =~ ^[Yy]$ ]]; then
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    print_success "Docker Engine installed"
else
    print_warning "Skipping Docker Engine installation"
fi

chmod +x run.sh
./run.sh
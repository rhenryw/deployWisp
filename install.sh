#!/bin/bash


# Usage: curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash -s urdomain.tld
# Exit immediately if a command exits with a non-zero status
set -e

echo "

 _____               __                        __              
|     \.-----.-----.|  |.-----.--.--.--.--.--.|__|.-----.-----.
|  --  |  -__|  _  ||  ||  _  |  |  |  |  |  ||  ||__ --|  _  |
|_____/|_____|   __||__||_____|___  |________||__||_____|   __|
             |__|             |_____|                   |__|   

by:"
echo "
       __             
.----.|  |--.--.--.--.
|   _||     |  |  |  |
|__|  |__|__|________|
                      
"

# Check if DOMAIN is set as an environment variable or passed as an argument
if [ -z "$DOMAIN" ]; then
  if [ -n "$1" ]; then
    DOMAIN=$1
  else
    echo "Error: Domain is not set. Please provide it as an environment variable or as a command-line argument."
    echo "Usage: DOMAIN=example.com bash install.sh"
    echo "   or: bash install.sh example.com"
    exit 1
  fi
fi

# Update package list and install prerequisites
echo "Updating package list and installing prerequisites..."
apt install sudo
sudo apt update
sudo apt install -y curl git sudo nginx certbot python3-certbot-nginx

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pm2 
echo "Installing pm2..."
sudo npm install -g pm2

# Clone the repo
REPO_URL="https://github.com/rhenryw/deployWisp.git"
TARGET_DIR="deployWisp"

echo "Cloning repository from $REPO_URL..."
git clone $REPO_URL

# Go into dir of repo
cd $TARGET_DIR

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Start the pm2
echo "Starting the application with pm2..."
pm2 start npm --name "deployWisp" -- start

# Set up pm2 to start on boot
echo "Setting up pm2 to start on boot..."
pm2 startup
pm2 save

# Set up NGINX
echo "Setting up NGINX for WebSocket forwarding..."
sudo bash -c "cat >/etc/nginx/sites-available/deploywisp.conf <<'EOF'
server {
  listen 80;
  server_name $DOMAIN;
  return 301 https://\$host\$request_uri;
}
server {
  listen 443 ssl http2;
  server_name $DOMAIN;
  ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade \$http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host \$host;
  }
}
EOF"

# Enable the NGINX configuration
sudo ln -sf /etc/nginx/sites-available/deploywisp.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate using Certbot
echo "Obtaining SSL certificate with Certbot..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m you@your.email

echo "NGINX has been set up to forward WebSocket traffic, and SSL has been configured."
echo "Application has been set up to start on boot and run indefinitely."

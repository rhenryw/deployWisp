#!/bin/bash

# Usage:
#   curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash -s yourdomain.tld

set -e

# ASCII banner
cat <<'BANNER'

 _____               __                        __              
|     \.-----.-----.|  |.-----.--.--.--.--.--.|__|.-----.-----. 
|  --  |  -__|  _  ||  ||  _  |  |  |  |  |  ||  ||__ --|  _  | 
|_____/|_____|   __||__||_____|___  |________||__||_____|   __| 
             |__|             |_____|                   |__|   

 by:

       __             
.----.|  |--.--.--.--.
|   _||     |  |  |  |
|__|  |__|__|________|
                      
BANNER

# Determine domain from argument
if [ -n "$1" ]; then
  DOMAIN=$1
elif [ -n "$DOMAIN" ]; then
  :
else
  echo "Error: Domain not provided."
  echo "Usage: curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash -s yourdomain.tld"
  exit 1
fi

echo "Ensuring sudo is installed..."
if ! command -v sudo >/dev/null; then
  apt-get update
  apt-get install -y sudo
fi

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl git nginx openssl

# Install Node.js and npm
echo "Installing Node.js (v22.x)..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2 process manager
echo "Installing pm2..."
sudo npm install -g pm2

# Clone the repository
echo "Updating and clearing old repo"
rm -rf deployWisp
echo "Cloning deployWisp repository..."
REPO_URL="https://github.com/rhenryw/deployWisp.git"
TARGET_DIR="deployWisp"
git clone "$REPO_URL"
cd "$TARGET_DIR"

# Install application dependencies
echo "Installing npm dependencies..."
npm install

# Start the application with pm2
echo "Starting application with pm2..."
npm run start:pm2 || pm2 start npm --name "deployWisp" -- start

# Configure pm2 to start on boot
echo "Configuring pm2 to start on boot..."
pm2 startup systemd -u "$USER" --hp "$HOME"
pm2 save


# NGINX configuration (wss only)
echo "Writing NGINX configuration for secure WebSocket (wss) proxy..."
sudo tee /etc/nginx/sites-available/deploywisp.conf > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;


    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/deploywisp.conf /etc/nginx/sites-enabled/

# Enable and start NGINX
echo "Enabling and starting NGINX..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Test configuration
echo "Testing NGINX configuration..."
sudo nginx -t

echo "Setup complete! Your application is now running behind Nginx with secure WebSocket (wss) using a self-signed cert."

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
  # DOMAIN environment variable was set
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
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js and npm
echo "Installing Node.js (v22.x)..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2 process manager
echo "Installing pm2..."
sudo npm install -g pm2

# Clone the repository
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
pm run start:pm2 || pm2 start npm --name "deployWisp" -- start

echo "Configuring pm2 to start on boot..."
pm pm2 startup systemd -u $USER --hp $HOME
pm save

# NGINX configuration
echo "Writing NGINX configuration for WebSocket forwarding..."
sudo tee /etc/nginx/sites-available/deploywisp.conf > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    http2;
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
EOF

# Enable and obtain SSL certificate
sudo ln -sf /etc/nginx/sites-available/deploywisp.conf /etc/nginx/sites-enabled/

echo "Obtaining and installing Let's Encrypt certificate..."
sudo certbot --nginx \
  --redirect \
  --agree-tos \
  --no-eff-email \
  -m you@your.email \
  -d $DOMAIN

# Test and reload NGINX
echo "Testing NGINX configuration..."
sudo nginx -t

echo "Reloading NGINX..."
sudo systemctl reload nginx

echo "Setup complete! Your application is now running behind NGINX with WebSocket support and HTTPS."

#!/bin/bash

# run with: curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "

 _____               __                        __              
|     \.-----.-----.|  |.-----.--.--.--.--.--.|__|.-----.-----.
|  --  |  -__|  _  ||  ||  _  |  |  |  |  |  ||  ||__ --|  _  |
|_____/|_____|   __||__||_____|___  |________||__||_____|   __|
             |__|             |_____|                   |__|   

by:"
echo"
       __             
.----.|  |--.--.--.--.
|   _||     |  |  |  |
|__|  |__|__|________|
                      
"
# Update package list and install prerequisites
echo "Updating package list and installing prerequisites..."
sudo apt update
sudo apt install -y curl git sudo

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

# Start the  pm2
echo "Starting the application with pm2..."
pm2 start npm --name "deployWisp" -- start

# Set up pm2 to start on boot
echo "Setting up pm2 to start on boot..."
pm2 startup
pm2 save

echo "Application has been set up to start on boot and run indefinitely."

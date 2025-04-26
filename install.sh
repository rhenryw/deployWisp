#!/bin/bash

# run with: curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "deployWisp by rhw"
# Update package list and install prerequisites
echo "Updating package list and installing prerequisites..."
sudo apt update
sudo apt install -y curl git

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone the repository
REPO_URL="https://github.com/rhenryw/deployWisp.git"
TARGET_DIR="deployWisp"

echo "Cloning repository from $REPO_URL..."
git clone $REPO_URL

# Navigate into the cloned repository
cd $TARGET_DIR

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Start the application
echo "Starting the application..."
npm start
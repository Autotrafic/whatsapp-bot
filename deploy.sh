#!/bin/bash

# Set the path to the app
APP_PATH="/whatsapp-bot/"
cd $APP_PATH

git pull origin master

# Install new packages and update existing ones
npm ci

# Build your project
npm run build

# Reload the app
pm2 reload pm2deployment.config.js

# Save the new process list
pm2 save

#pm2 reset all

echo "deploy totalum whatsapp complete"

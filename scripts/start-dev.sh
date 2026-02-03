#!/bin/bash
# Start both Express API server and Metro bundler with tunnel

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "expo start" 2>/dev/null
sleep 2

# Start Express server in background on port 5000
echo "🚀 Starting Express API server on port 5000..."
NODE_ENV=development PORT=5000 tsx server/index.ts &
EXPRESS_PID=$!

# Wait for Express to start
sleep 3

# Start Metro with tunnel on port 8081
echo "🔧 Starting Metro bundler with tunnel..."
export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_DEV_DOMAIN}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${REPLIT_DEV_DOMAIN}"
export EXPO_PUBLIC_DOMAIN="${REPLIT_DEV_DOMAIN}"

npx expo start --tunnel --clear --port 8081

# Cleanup on exit
trap "kill $EXPRESS_PID 2>/dev/null" EXIT

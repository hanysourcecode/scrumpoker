#!/bin/sh

# Railway start script
# This ensures the app uses the PORT environment variable set by Railway

echo "Starting Scrum Poker app on port ${PORT:-5000}"

# Start the Node.js server
node server.js

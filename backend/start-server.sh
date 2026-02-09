#!/bin/bash

# This script safely stops any existing Node.js processes running on port 3000
# and then starts the backend server

echo "Checking for processes on port 3000..."

# Find the PID of any process using port 3000
PORT_PID=$(lsof -i:3000 -t)

if [ -n "$PORT_PID" ]; then
    echo "Found process (PID: $PORT_PID) using port 3000"
    echo "Stopping process..."
    kill -15 $PORT_PID
    
    # Wait a moment to make sure the process has stopped
    sleep 2
    
    # Check if the process is still running
    if ps -p $PORT_PID > /dev/null; then
        echo "Process didn't stop gracefully, forcing termination..."
        kill -9 $PORT_PID
        sleep 1
    fi
    
    echo "Process stopped."
else
    echo "No process found using port 3000"
fi

echo "Starting backend server..."
cd "$(dirname "$0")" # Navigate to script directory
npm run dev

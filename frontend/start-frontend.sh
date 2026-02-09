#!/bin/bash

# This script starts the frontend server after checking if the backend is available

echo "Checking backend server availability..."
MAX_ATTEMPTS=5
attempt=0
backend_found=false

while [ $attempt -lt $MAX_ATTEMPTS ] && [ "$backend_found" = false ]; do
    attempt=$((attempt+1))
    echo "Checking backend (attempt $attempt of $MAX_ATTEMPTS)..."
    
    if curl -s http://localhost:3000/ > /dev/null; then
        echo "Backend server found on port 3000."
        backend_found=true
    else
        for port in {3001..3010}; do
            if curl -s http://localhost:$port/ > /dev/null; then
                echo "Backend server found on port $port."
                backend_found=true
                echo "PORT=5173" > .env.local
                echo "VITE_BACKEND_PORT=$port" >> .env.local
                break
            fi
        done
    fi
    
    if [ "$backend_found" = false ]; then
        echo "Backend server not found, waiting 2 seconds..."
        sleep 2
    fi
done

if [ "$backend_found" = false ]; then
    echo "WARNING: Backend server not detected. The frontend may not function correctly."
    echo "Starting frontend server anyway..."
else
    echo "Backend server detected. Starting frontend server..."
fi

cd "$(dirname "$0")" # Navigate to script directory
npm run dev

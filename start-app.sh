#!/bin/bash

# This script starts both the backend and frontend servers

echo "Starting URTMtakip System..."
WORKSPACE_ROOT="$(dirname "$0")"

echo "1. Starting backend server..."
cd "$WORKSPACE_ROOT/backend"
./start-server.sh &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to initialize
echo "Waiting for backend to initialize..."
sleep 5

echo "2. Starting frontend server..."
cd "$WORKSPACE_ROOT/frontend"
./start-frontend.sh &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "Both servers started."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle Ctrl+C to stop both servers
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep the script running
wait

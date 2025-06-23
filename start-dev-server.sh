#!/bin/bash

# Van Builder Development Server Launcher
# This script starts both the React frontend and the backend server

PROJECT_DIR="/home/ron/Dev/Van_Builder_Directory"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"

# Function to start backend server (hidden)
start_backend() {
    echo "Starting Backend Server..."
    cd "$PROJECT_DIR/server"
    # Start backend in background, redirect output to log file
    nohup node api.js > /tmp/van-builder-backend.log 2>&1 &
    echo $! > /tmp/van-builder-backend.pid
}

# Function to start React frontend (hidden)
start_frontend() {
    echo "Starting React Frontend..."
    cd "$PROJECT_DIR"
    # Start frontend in background, redirect output to log file
    BROWSER=none nohup npm start > /tmp/van-builder-frontend.log 2>&1 &
    echo $! > /tmp/van-builder-frontend.pid
}

# Function to open browser smartly
open_browser() {
    echo "Opening browser..."
    
    # Wait a moment for servers to fully start
    sleep 3
    
    # Check if Firefox is running
    if pgrep firefox > /dev/null; then
        # Firefox is running, open new tab
        firefox --new-tab "$FRONTEND_URL" 2>/dev/null &
    else
        # Firefox not running, start it
        firefox "$FRONTEND_URL" 2>/dev/null &
    fi
}

# Function to check if servers are already running
check_existing_servers() {
    if [ -f /tmp/van-builder-backend.pid ] && [ -f /tmp/van-builder-frontend.pid ]; then
        backend_pid=$(cat /tmp/van-builder-backend.pid)
        frontend_pid=$(cat /tmp/van-builder-frontend.pid)
        
        if kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; then
            echo "🚐 Servers are already running!"
            echo "Frontend: $FRONTEND_URL"
            echo "Backend: $BACKEND_URL"
            open_browser
            notify-send "Van Builder" "Development servers already running! Opening browser..." --icon=web-browser
            exit 0
        fi
    fi
}

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: Project directory not found at $PROJECT_DIR"
    exit 1
fi

# Check if servers are already running
check_existing_servers

# Start both servers
echo "🚐 Starting Van Builder Development Environment..."
echo "Starting servers in background..."

start_backend
sleep 2  # Give backend a moment to start
start_frontend

echo "✅ Development servers started!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""
echo "📌 Opening browser automatically..."

# Open browser
open_browser

# Show desktop notification
notify-send "Van Builder" "Development servers started successfully!\nFrontend: $FRONTEND_URL" --icon=applications-development

echo "🎉 All ready! Servers are running in background."
echo "To stop servers, run: pkill -f 'npm start' && pkill -f 'node api.js'" 
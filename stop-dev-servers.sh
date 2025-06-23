#!/bin/bash

# Van Builder Development Server Stopper
# This script stops the background development servers

echo "🛑 Stopping Van Builder Development Servers..."

# Stop servers using PID files if they exist
stopped_any=false

if [ -f /tmp/van-builder-backend.pid ]; then
    backend_pid=$(cat /tmp/van-builder-backend.pid)
    if kill -0 "$backend_pid" 2>/dev/null; then
        kill "$backend_pid" 2>/dev/null
        echo "✅ Backend server stopped (PID: $backend_pid)"
        stopped_any=true
    fi
    rm -f /tmp/van-builder-backend.pid
fi

if [ -f /tmp/van-builder-frontend.pid ]; then
    frontend_pid=$(cat /tmp/van-builder-frontend.pid)
    if kill -0 "$frontend_pid" 2>/dev/null; then
        kill "$frontend_pid" 2>/dev/null
        echo "✅ Frontend server stopped (PID: $frontend_pid)"
        stopped_any=true
    fi
    rm -f /tmp/van-builder-frontend.pid
fi

# More aggressive fallback: kill any remaining processes
echo "🔍 Checking for any remaining server processes..."

# Kill React development server by specific path
react_pids=$(pgrep -f "react-scripts/scripts/start.js")
if [ -n "$react_pids" ]; then
    echo "$react_pids" | xargs kill 2>/dev/null
    echo "✅ Stopped React development server (PIDs: $react_pids)"
    stopped_any=true
fi

# Kill any process running from Van_Builder_Directory
van_pids=$(pgrep -f "Van_Builder_Directory")
if [ -n "$van_pids" ]; then
    # Filter out this script and other safe processes
    filtered_pids=$(echo "$van_pids" | xargs ps -p 2>/dev/null | grep -E "(node|npm)" | awk '{print $1}' | grep -v "$$")
    if [ -n "$filtered_pids" ]; then
        echo "$filtered_pids" | xargs kill 2>/dev/null
        echo "✅ Stopped Van Builder processes (PIDs: $filtered_pids)"
        stopped_any=true
    fi
fi

# Kill npm start processes specifically
npm_pids=$(pgrep -f "npm.*start")
if [ -n "$npm_pids" ]; then
    echo "$npm_pids" | xargs kill 2>/dev/null
    echo "✅ Stopped npm start processes (PIDs: $npm_pids)"
    stopped_any=true
fi

# Kill Node.js API server specifically
api_pids=$(pgrep -f "node.*api.js")
if [ -n "$api_pids" ]; then
    echo "$api_pids" | xargs kill 2>/dev/null
    echo "✅ Stopped Node.js API server (PIDs: $api_pids)"
    stopped_any=true
fi

# Clean up log files
rm -f /tmp/van-builder-backend.log /tmp/van-builder-frontend.log

if [ "$stopped_any" = true ]; then
    echo "🎉 Van Builder servers stopped successfully!"
    echo "💡 Try refreshing your browser - the site should no longer load"
    notify-send "Van Builder" "Development servers stopped successfully!" --icon=process-stop
else
    echo "ℹ️  No Van Builder servers were running"
    notify-send "Van Builder" "No servers were running to stop" --icon=dialog-information
fi 
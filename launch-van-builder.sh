#!/bin/bash

# Van Builder Desktop Launcher Wrapper
# Ensures proper directory and environment setup

# Check if script exists (directory is set by .desktop Path)
if [ ! -f "./start-dev-server.sh" ]; then
    echo "Error: Van Builder start script not found" >&2
    exit 1
fi

# Make sure script is executable
chmod +x ./start-dev-server.sh

# Launch the development servers
./start-dev-server.sh 
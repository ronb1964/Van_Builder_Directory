#!/bin/bash

# Van Builder Desktop Icon Updater
# Use this script to update the desktop icon with the correct favicon

echo "🚐 Updating Van Builder desktop icon..."

# Convert the correct SVG favicon to clean PNG
magick public/favicon.svg -background transparent -resize 64x64 van-favicon-clean.png

# Update desktop entry
cp van-builder-dev.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications/

echo "✅ Desktop icon updated with correct favicon!"
echo "📌 The icon uses: public/favicon.svg (the actual website favicon)"
echo "📌 If you need to update it, edit public/favicon.svg and run this script again" 
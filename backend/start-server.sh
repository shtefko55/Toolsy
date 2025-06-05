#!/bin/bash

echo "🎵 Starting Audio Conversion Server..."
echo "🔧 Checking dependencies..."

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found. Installing..."
    sudo apt update && sudo apt install -y ffmpeg
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Dependencies checked"
echo "📦 Installing npm packages..."

npm install

echo "🚀 Starting server on port 3001..."
echo "📊 Real-time progress tracking enabled"
echo "🎯 FFmpeg-powered conversion"
echo ""
echo "Server will be available at: http://localhost:3001"
echo "Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 
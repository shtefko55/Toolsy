#!/bin/bash

echo "🚀 Starting VIDEO DWN - Multi-Platform Video Downloader"
echo "📹 Supported platforms: YouTube, Instagram, Facebook, X/Twitter"
echo ""

# Kill any existing video servers
echo "🔄 Stopping existing video servers..."
pkill -f "youtube-server.js" 2>/dev/null
pkill -f "video-server.js" 2>/dev/null
sleep 2

# Start the new multi-platform video server
echo "🎬 Starting VIDEO DWN server on port 3002..."
cd backend && npm run start-video

echo ""
echo "✅ VIDEO DWN is ready!"
echo "🌐 Access via: http://localhost:5173"
echo "🔧 API Health: http://localhost:3002/api/health"
echo ""
echo "📱 Supported URLs:"
echo "  📹 YouTube: https://youtube.com/watch?v=..."
echo "  📷 Instagram: https://instagram.com/p/..."
echo "  👥 Facebook: https://facebook.com/..."
echo "  🐦 X/Twitter: https://x.com/..." 
# VIDEO DWN - Multi-Platform Video Downloader

## 🎬 Overview

VIDEO DWN is a comprehensive multi-platform video downloader integrated into the Toolzi retro computing environment. It supports downloading videos from YouTube, Instagram, Facebook, and X (Twitter) with a beautiful Windows 98-themed interface.

## 🌟 Features

### Supported Platforms
- **📹 YouTube** - Full video and audio download support
- **📷 Instagram** - Stories, posts, and reels
- **👥 Facebook** - Public videos and posts
- **🐦 X/Twitter** - Video tweets and media

### Download Options
- **Quality Selection**: Highest, 720p, 480p, 360p, Audio Only
- **Format Support**: MP4, WebM, MP3 (for audio)
- **Real-time Progress**: Live download progress with Socket.IO
- **Auto-download**: Automatic file download when complete
- **Platform Detection**: Automatic platform recognition and branding

### Technical Features
- **yt-dlp Backend**: Uses the powerful yt-dlp library for reliable downloads
- **Large File Support**: Handles files up to 500MB (vs 25MB browser limit)
- **Professional Quality**: Multiple quality presets and format options
- **Real-time Updates**: WebSocket-based progress tracking
- **Automatic Cleanup**: Files auto-deleted after download
- **Error Handling**: Comprehensive error reporting and recovery

## 🚀 Quick Start

### 1. Start the Server
```bash
# Option 1: Use the startup script
./start-video-dwn.sh

# Option 2: Manual start
npm run start-video
```

### 2. Access the Interface
- Open your browser to `http://localhost:5173`
- Click on the **VIDEO DWN** desktop icon
- The server runs on port `3002`

### 3. Download a Video
1. **Enter URL**: Paste any supported video URL
2. **Get Info**: Click "Get Info" to fetch video details
3. **Select Options**: Choose quality and format
4. **Download**: Click "Start Download" and wait for completion

## 📱 Supported URL Formats

### YouTube
```
https://youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/watch?v=VIDEO_ID
```

### Instagram
```
https://instagram.com/p/POST_ID/
https://www.instagram.com/p/POST_ID/
https://instagram.com/stories/USERNAME/STORY_ID/
```

### Facebook
```
https://facebook.com/watch?v=VIDEO_ID
https://www.facebook.com/USERNAME/videos/VIDEO_ID/
https://fb.watch/VIDEO_ID/
```

### X (Twitter)
```
https://x.com/USERNAME/status/TWEET_ID
https://twitter.com/USERNAME/status/TWEET_ID
```

## 🔧 API Endpoints

### Health Check
```bash
GET http://localhost:3002/api/health
```

### Get Video Information
```bash
POST http://localhost:3002/api/video-info
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}
```

### Start Download
```bash
POST http://localhost:3002/api/download
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=VIDEO_ID",
  "quality": "720p",
  "format": "mp4"
}
```

### Download File
```bash
GET http://localhost:3002/api/file/:downloadId
```

### Check Status
```bash
GET http://localhost:3002/api/status/:downloadId
```

## 🛠️ Technical Architecture

### Backend (Node.js + Express)
- **Port**: 3002
- **Engine**: yt-dlp (system binary)
- **Real-time**: Socket.IO for progress updates
- **Storage**: Temporary downloads in `backend/downloads/`
- **Cleanup**: Automatic file cleanup after download

### Frontend (React + TypeScript)
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with Win98 theme
- **Real-time**: Socket.IO client for progress
- **State**: React hooks for state management

### Dependencies
- **yt-dlp**: System binary for video downloading
- **Node.js**: Backend runtime
- **Express**: Web server framework
- **Socket.IO**: Real-time communication
- **fs-extra**: Enhanced file system operations
- **uuid**: Unique download ID generation

## 📋 Installation Requirements

### System Dependencies
```bash
# Install yt-dlp (if not already installed)
sudo apt install yt-dlp  # Ubuntu/Debian
brew install yt-dlp      # macOS
```

### Node.js Dependencies
```bash
# Backend dependencies (already installed)
cd backend
npm install express cors fs-extra socket.io uuid

# Frontend dependencies (already installed)
npm install socket.io-client
```

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check if port 3002 is in use
lsof -i :3002

# Kill existing processes
pkill -f "video-server.js"

# Restart server
npm run start-video
```

### Download Fails
1. **Check URL**: Ensure the URL is from a supported platform
2. **Check yt-dlp**: Verify yt-dlp is installed and updated
3. **Check Logs**: Look at server console for error messages
4. **Try Different Quality**: Some videos may not have all qualities

### Connection Issues
1. **CORS**: Server includes CORS headers for localhost ports
2. **Firewall**: Ensure port 3002 is not blocked
3. **Browser**: Try refreshing or clearing browser cache

## 🎨 UI Features

### Windows 98 Theme
- **Window Frames**: Classic 3D border styling
- **Buttons**: Raised/pressed button effects
- **Progress Bars**: Retro progress bar design
- **Status Indicators**: Color-coded connection status
- **Platform Badges**: Visual platform identification

### Real-time Updates
- **Connection Status**: Live server connection indicator
- **Download Progress**: Real-time progress bar and percentage
- **Platform Detection**: Automatic platform icon and branding
- **Error Handling**: User-friendly error messages

## 📊 Performance

### File Size Limits
- **Maximum**: 500MB per download
- **Recommended**: Under 100MB for best performance
- **Cleanup**: Files auto-deleted after 10 seconds

### Quality Options
- **Highest**: Best available quality (may be large)
- **720p**: HD quality, good balance of size/quality
- **480p**: Standard definition, smaller files
- **360p**: Low quality, fastest downloads
- **Audio Only**: Extract audio track only

## 🔐 Security & Privacy

### Data Handling
- **No Storage**: Videos are not permanently stored
- **Temporary Files**: Downloads cleaned up automatically
- **No Logging**: User URLs and downloads not logged
- **Local Only**: All processing happens locally

### Educational Use
- **Purpose**: Educational and personal use only
- **Compliance**: Respect platform terms of service
- **Copyright**: User responsible for copyright compliance

## 🚀 Future Enhancements

### Planned Features
- **Batch Downloads**: Multiple URLs at once
- **Playlist Support**: Download entire playlists
- **Custom Output**: User-defined file naming
- **Download History**: Track previous downloads
- **Quality Auto-select**: Smart quality selection

### Platform Expansion
- **TikTok**: Short video downloads
- **Vimeo**: Professional video platform
- **Twitch**: Clip and VOD downloads
- **Reddit**: Video post downloads

## 📞 Support

### Getting Help
1. **Check Logs**: Look at browser console and server logs
2. **Verify URLs**: Ensure URLs are from supported platforms
3. **Update yt-dlp**: Keep yt-dlp updated for best compatibility
4. **Restart Server**: Try restarting the video server

### Common Solutions
- **"Unsupported platform"**: Check URL format and platform support
- **"Download failed"**: Try different quality or format
- **"Server disconnected"**: Restart the video server
- **"File not found"**: File may have been cleaned up, re-download

---

**VIDEO DWN v2.0** - Part of the Toolzi Retro Computing Environment  
Educational Use Only | Respect Platform Terms of Service 
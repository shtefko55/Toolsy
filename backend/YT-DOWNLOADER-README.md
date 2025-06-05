# 📺 YT DW - YouTube Downloader

A retro Windows 98-styled YouTube video downloader with real-time progress tracking and multiple quality options.

## 🚀 Features

### Core Functionality
- **YouTube Video Download**: Download videos from YouTube URLs
- **Multiple Quality Options**: Highest, 720p, 480p, 360p, Audio Only
- **Format Support**: MP4, WebM, MP3 (for audio)
- **Real-time Progress**: Live download progress with Socket.IO
- **Auto-download**: Automatic file download when conversion completes

### User Interface
- **Retro Windows 98 Design**: Authentic Win98 window styling
- **Video Information Display**: Thumbnail, title, author, duration, views
- **Progress Visualization**: Real-time progress bar and status updates
- **Server Status Indicator**: Connection status monitoring

## 🛠️ Technical Stack

### Backend (Port 3002)
- **Node.js + Express**: Web server framework
- **ytdl-core**: YouTube video downloading library
- **Socket.IO**: Real-time progress communication
- **fs-extra**: Enhanced file system operations
- **UUID**: Unique download ID generation

### Frontend
- **React + TypeScript**: Modern UI framework
- **Socket.IO Client**: Real-time server communication
- **Retro Styling**: Windows 98 themed components

## 📋 API Endpoints

### Health Check
```
GET /api/health
Response: { status: "healthy", timestamp: "...", service: "YouTube Downloader" }
```

### Get Video Information
```
POST /api/video-info
Body: { url: "https://youtube.com/watch?v=..." }
Response: {
  title: "Video Title",
  duration: "300",
  thumbnail: "https://...",
  author: "Channel Name",
  viewCount: "1000000",
  availableQualities: ["720p", "480p", ...]
}
```

### Start Download
```
POST /api/download
Body: { 
  url: "https://youtube.com/watch?v=...",
  quality: "highest|720p|480p|360p|audio",
  format: "mp4|webm|mp3"
}
Response: { downloadId: "uuid", message: "Download started", filename: "..." }
```

### Download File
```
GET /api/file/:downloadId
Response: File stream with appropriate headers
```

### Check Status
```
GET /api/status/:downloadId
Response: { downloadId: "...", status: "...", progress: 50, ... }
```

## 🔄 Real-time Events

### Socket.IO Events
- **downloadProgress**: Progress updates during download
  ```javascript
  {
    downloadId: "uuid",
    progress: 75,
    status: "downloading|completed|error",
    message: "Downloading... 75%",
    downloadUrl: "/api/file/uuid" // when completed
  }
  ```

## 🚀 Getting Started

### 1. Start YouTube Server
```bash
cd backend
npm run start-yt
# or
./start-yt-server.sh
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Access YT DW
- Open browser to frontend URL (usually http://localhost:8082)
- Click on the **YT DW** 📺 desktop icon
- Enter a YouTube URL and start downloading!

## 📖 Usage Guide

### Step 1: Enter YouTube URL
- Paste any valid YouTube video URL
- Click "🔍 Get Info" to fetch video details

### Step 2: Review Video Information
- Check video title, author, duration, and thumbnail
- Verify this is the correct video

### Step 3: Select Download Options
- **Quality**: Choose from Highest, 720p, 480p, 360p, or Audio Only
- **Format**: Select MP4, WebM, or MP3 (for audio)

### Step 4: Start Download
- Click "📥 Start Download"
- Monitor real-time progress
- File will auto-download when complete

## ⚙️ Configuration

### Server Settings
- **Port**: 3002 (configurable in youtube-server.js)
- **Download Directory**: `backend/downloads/`
- **File Cleanup**: Auto-cleanup after 2 hours
- **Max File Age**: 10 seconds after download

### Quality Options
- **Highest**: Best available quality
- **720p**: HD quality (if available)
- **480p**: Standard definition
- **360p**: Lower quality, smaller file
- **Audio**: Audio-only download

## 🔧 Troubleshooting

### Common Issues

#### Server Connection Failed
- Ensure YouTube server is running on port 3002
- Check if port is already in use
- Verify CORS settings for your frontend port

#### Video Info Not Loading
- Verify YouTube URL is valid and accessible
- Check if video is region-restricted
- Ensure ytdl-core is up to date

#### Download Fails
- Check available disk space
- Verify video is still available on YouTube
- Try different quality settings

#### Auto-download Not Working
- Check browser download settings
- Ensure pop-up blocker isn't interfering
- Try manual download button

### Debug Commands
```bash
# Check server health
curl http://localhost:3002/api/health

# Test video info
curl -X POST http://localhost:3002/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# Check server logs
cd backend && npm run start-yt
```

## 📁 File Structure
```
backend/
├── youtube-server.js          # Main YouTube server
├── downloads/                 # Downloaded files directory
├── start-yt-server.sh        # Startup script
└── package.json              # Dependencies

src/pages/
└── YTDownloader.tsx          # Main YT DW component
```

## 🔒 Legal Notice

**Educational Use Only**: This tool is for educational purposes and personal use. Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws.

## 🎯 Future Enhancements

- [ ] Playlist download support
- [ ] Download queue management
- [ ] Custom output directory selection
- [ ] Download history
- [ ] Batch download capabilities
- [ ] Video format conversion options

---

**YT DW v1.0** - Part of the Toolzy retro computing experience 🖥️ 
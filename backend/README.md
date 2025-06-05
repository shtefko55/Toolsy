# 🎵 Professional Audio Conversion Server

A powerful, server-side audio conversion solution using FFmpeg with real-time progress tracking and unlimited format support.

## ✨ Features

### 🚀 **No Browser Crashes**
- Server-side processing eliminates browser memory limitations
- Handle files up to **500MB** without crashes
- No more 90% conversion failures!

### 🎯 **Universal Format Support**
- **Input:** MP3, WAV, OGG, FLAC, AAC, M4A, WebM, MP4, 3GP, AMR, WMA
- **Output:** MP3, WAV, OGG, FLAC, AAC, M4A, WebM
- Professional FFmpeg-powered conversion

### ⚡ **Real-time Progress**
- Live progress updates via WebSocket (Socket.IO)
- Detailed status messages
- Automatic file cleanup

### 🛠️ **Professional Quality**
- Multiple quality presets (Low, Medium, High, Lossless)
- Custom sample rate and channel configuration
- Industry-standard codecs

## 🚀 Quick Start

### 1. Start the Server
```bash
# Method 1: Use the startup script
cd backend
./start-server.sh

# Method 2: Manual start
cd backend
npm install
npm start
```

### 2. Server Status
- **URL:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **Supported Formats:** http://localhost:3001/api/formats

### 3. Use the Frontend
1. Start your main Toolzi app
2. Go to Audio Tools
3. Select "Pro Audio Converter" 🚀
4. Upload and convert without crashes!

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```
Response: Server status and FFmpeg availability

### Supported Formats
```http
GET /api/formats
```
Response: Available input/output formats and quality levels

### File Conversion
```http
POST /api/convert
Content-Type: multipart/form-data

Parameters:
- audio: File (required)
- format: string (mp3, wav, ogg, flac, aac, m4a, webm)
- quality: string (low, medium, high, lossless)
- sampleRate: number (optional)
- channels: number (optional)
- bitRate: string (optional)
```

### Download Converted File
```http
GET /api/download/:conversionId
```

### Check Conversion Status
```http
GET /api/status/:conversionId
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=500MB
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
CLEANUP_INTERVAL=30m
MAX_FILE_AGE=1h
FFMPEG_THREADS=4
```

### Quality Presets

#### MP3/AAC/OGG/WebM
- **Low:** 96 kbps
- **Medium:** 128 kbps  
- **High:** 192 kbps
- **Lossless:** 320 kbps

#### WAV/FLAC
- **Low:** 22,050 Hz
- **Medium:** 44,100 Hz
- **High:** 48,000 Hz
- **Lossless:** 96,000 Hz

## 🌐 WebSocket Events

### Client → Server
```javascript
// Connection established automatically
socket.on('connect', () => {
  console.log('Connected to conversion server');
});
```

### Server → Client
```javascript
// Real-time progress updates
socket.on('conversionProgress', (data) => {
  console.log({
    conversionId: data.conversionId,
    progress: data.progress,        // 0-100
    status: data.status,            // 'uploading' | 'processing' | 'completed' | 'error'
    message: data.message,          // Human-readable status
    downloadUrl: data.downloadUrl   // Available when completed
  });
});
```

## 🛡️ Security & Cleanup

### Automatic Cleanup
- Input files deleted after processing
- Output files deleted after download (5s delay)
- Orphaned files cleaned every 30 minutes
- Maximum file age: 1 hour

### File Size Limits
- **Upload:** 500MB maximum
- **Processing:** No memory limits (server-side)
- **Storage:** Temporary only

### Supported MIME Types
```javascript
[
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/m4a', 'audio/webm', 'audio/mp4',
  'video/mp4', 'video/webm', 'video/ogg'
]
```

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check if FFmpeg is installed
ffmpeg -version

# Check if port 3001 is available
netstat -tulpn | grep 3001

# Install missing dependencies
sudo apt update && sudo apt install -y ffmpeg
```

### Frontend Connection Issues
```javascript
// Check CORS settings in server.js
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});
```

### Conversion Failures
- Check FFmpeg logs in server console
- Verify input file is valid audio
- Ensure sufficient disk space
- Check file permissions

## 📊 Performance

### Benchmarks
- **Small files (< 10MB):** ~2-5 seconds
- **Medium files (10-50MB):** ~5-15 seconds  
- **Large files (50-500MB):** ~15-60 seconds

### Memory Usage
- **Server:** ~50-100MB baseline
- **During conversion:** +~200MB per active job
- **Browser:** Minimal (no audio processing)

## 🚀 Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎉 Comparison: Browser vs Server

| Feature | Browser Converter | Server Converter |
|---------|------------------|------------------|
| **File Size Limit** | 25MB | 500MB |
| **Stability** | Crashes at 90% | Rock solid |
| **Format Support** | WAV, WebM only | All major formats |
| **Quality** | Limited | Professional |
| **Speed** | Slow | Fast |
| **Memory Usage** | High (browser) | None (browser) |

## 📝 License

MIT License - Use freely for personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**🎵 Server-Side Audio Conversion - No More Browser Crashes!** 🚀 
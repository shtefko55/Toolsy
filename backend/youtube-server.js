const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = 3002;

// Create directories
const downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);

// CORS and Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
  credentials: true
}));
app.use(express.json());
app.use(express.static('downloads'));

// Store active downloads
const activeDownloads = new Map();

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('YT Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('YT Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'YouTube Downloader'
  });
});

// Get video info
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log('🔍 Getting video info for:', url);
    
    // Configure ytdl with better options
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    const videoDetails = info.videoDetails;
    
    // Get available formats with better error handling
    let formats = [];
    let audioFormats = [];
    
    try {
      if (info.formats && Array.isArray(info.formats)) {
        formats = info.formats.filter(f => f.hasVideo && f.hasAudio);
        audioFormats = info.formats.filter(f => f.hasAudio && !f.hasVideo);
      }
    } catch (err) {
      console.error('Format filtering error:', err);
      formats = [];
      audioFormats = [];
    }
    
    const availableQualities = [
      ...new Set([
        ...formats.map(f => f.qualityLabel).filter(q => q),
        'Audio Only'
      ])
    ].filter(Boolean);

    res.json({
      title: videoDetails.title,
      duration: videoDetails.lengthSeconds,
      thumbnail: videoDetails.thumbnails[0]?.url,
      author: videoDetails.author.name,
      viewCount: videoDetails.viewCount,
      uploadDate: videoDetails.uploadDate,
      description: videoDetails.description?.substring(0, 200) + '...',
      availableQualities,
      formats: formats.map(f => ({
        itag: f.itag,
        quality: f.qualityLabel,
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        filesize: f.contentLength
      })).slice(0, 10) // Limit to top 10 formats
    });

  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({ 
      error: 'Failed to get video information',
      details: error.message
    });
  }
});

// Download video
app.post('/api/download', async (req, res) => {
  try {
    const { url, quality = 'highest', format = 'mp4' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const downloadId = uuidv4();
    console.log(`🚀 Starting download ${downloadId}: ${url}`);
    
    // Get video info with better options
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    const videoDetails = info.videoDetails;
    
    // Create safe filename
    const safeTitle = videoDetails.title
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const filename = `${safeTitle}_${downloadId}.${format}`;
    const outputPath = path.join(downloadsDir, filename);
    
    // Store download info
    activeDownloads.set(downloadId, {
      id: downloadId,
      url,
      title: videoDetails.title,
      filename,
      outputPath,
      status: 'starting',
      progress: 0,
      createdAt: Date.now()
    });

    res.json({
      downloadId,
      message: 'Download started',
      filename
    });

    // Start download process
    let totalSize = 0;
    let downloadedSize = 0;
    
    // Choose format based on quality with better error handling
    let chosenFormat;
    try {
      if (quality === 'audio') {
        // Find best audio format
        chosenFormat = info.formats
          .filter(f => f.hasAudio && !f.hasVideo)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      } else {
        // Find best video+audio format
        const videoFormats = info.formats.filter(f => f.hasVideo && f.hasAudio);
        if (quality === 'highest') {
          chosenFormat = videoFormats
            .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
        } else {
          // Try to find specific quality
          const targetHeight = quality === '720p' ? 720 : quality === '480p' ? 480 : quality === '360p' ? 360 : 1080;
          chosenFormat = videoFormats
            .filter(f => f.height <= targetHeight)
            .sort((a, b) => (b.height || 0) - (a.height || 0))[0] || videoFormats[0];
        }
      }
      
      // Fallback to any available format
      if (!chosenFormat) {
        chosenFormat = info.formats.filter(f => f.hasAudio)[0];
      }
    } catch (err) {
      console.error('Format selection error:', err);
      chosenFormat = info.formats[0]; // Last resort fallback
    }
    
    totalSize = parseInt(chosenFormat.contentLength) || 0;
    
    console.log('Selected format:', {
      itag: chosenFormat.itag,
      quality: chosenFormat.qualityLabel,
      hasVideo: chosenFormat.hasVideo,
      hasAudio: chosenFormat.hasAudio,
      container: chosenFormat.container
    });
    
    // Create download stream
    const stream = ytdl(url, { 
      quality: chosenFormat.itag,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    
    const writeStream = fs.createWriteStream(outputPath);
    
    stream.on('progress', (chunkLength, downloaded, total) => {
      downloadedSize = downloaded;
      const progress = totalSize > 0 ? Math.round((downloaded / total) * 100) : 0;
      
      activeDownloads.set(downloadId, {
        ...activeDownloads.get(downloadId),
        progress,
        status: 'downloading',
        downloadedSize: downloaded,
        totalSize: total
      });

      io.emit('downloadProgress', {
        downloadId,
        progress,
        status: 'downloading',
        downloaded,
        total,
        message: `Downloading... ${progress}%`
      });
    });
    
    stream.on('end', () => {
      console.log(`✅ Download completed: ${downloadId}`);
      
      activeDownloads.set(downloadId, {
        ...activeDownloads.get(downloadId),
        progress: 100,
        status: 'completed'
      });

      io.emit('downloadProgress', {
        downloadId,
        progress: 100,
        status: 'completed',
        message: 'Download completed!',
        downloadUrl: `/api/file/${downloadId}`
      });
    });
    
    stream.on('error', (error) => {
      console.error(`❌ Download error ${downloadId}:`, error);
      
      activeDownloads.set(downloadId, {
        ...activeDownloads.get(downloadId),
        status: 'error',
        error: error.message
      });

      io.emit('downloadProgress', {
        downloadId,
        progress: 0,
        status: 'error',
        message: `Download failed: ${error.message}`
      });
      
      // Clean up failed download
      fs.removeSync(outputPath);
    });
    
    // Pipe to file
    stream.pipe(writeStream);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Download failed', 
      details: error.message 
    });
  }
});

// Download file endpoint
app.get('/api/file/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  if (download.status !== 'completed') {
    return res.status(400).json({ error: 'Download not completed' });
  }

  if (!fs.existsSync(download.outputPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${download.filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  try {
    const stats = fs.statSync(download.outputPath);
    res.setHeader('Content-Length', stats.size);
  } catch (err) {
    console.error('Error getting file stats:', err);
  }
  
  // Handle aborted requests
  req.on('aborted', () => {
    console.log(`Download aborted by client: ${downloadId}`);
  });
  
  res.on('close', () => {
    console.log(`Download connection closed: ${downloadId}`);
  });
  
  // Stream file
  const stream = fs.createReadStream(download.outputPath);
  
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream error' });
    }
  });
  
  stream.on('end', () => {
    console.log(`File sent successfully: ${downloadId}`);
    // Clean up file after download
    setTimeout(() => {
      try {
        fs.removeSync(download.outputPath);
        activeDownloads.delete(downloadId);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 10000); // 10 seconds delay
  });
  
  stream.pipe(res);
});

// Get download status
app.get('/api/status/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json({
    downloadId,
    status: download.status,
    progress: download.progress,
    title: download.title,
    filename: download.filename,
    error: download.error
  });
});

// Clean up old downloads periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours

  for (const [id, download] of activeDownloads.entries()) {
    if (now - download.createdAt > maxAge) {
      if (fs.existsSync(download.outputPath)) {
        fs.removeSync(download.outputPath);
      }
      activeDownloads.delete(id);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

// Start server
server.listen(PORT, () => {
  console.log(`📺 YouTube Downloader Server running on port ${PORT}`);
  console.log(`🔗 Real-time progress available via Socket.IO`);
  console.log(`📁 Downloads saved to: ${downloadsDir}`);
  console.log(`🎯 Supported: Video + Audio, Audio Only`);
});

module.exports = { app, server, io }; 
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
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
  console.log('Video Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Video Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Multi-Platform Video Downloader',
    supported: ['YouTube', 'Instagram', 'Facebook', 'X/Twitter']
  });
});

// Detect platform from URL
function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { platform: 'YouTube', icon: '📹' };
  } else if (url.includes('instagram.com')) {
    return { platform: 'Instagram', icon: '📷' };
  } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return { platform: 'Facebook', icon: '👥' };
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return { platform: 'X/Twitter', icon: '🐦' };
  } else {
    return { platform: 'Unknown', icon: '❓' };
  }
}

// Validate URL for supported platforms
function validateURL(url) {
  const supportedDomains = [
    'youtube.com', 'youtu.be',
    'instagram.com',
    'facebook.com', 'fb.watch',
    'twitter.com', 'x.com'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

// Get video info using yt-dlp
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    if (!validateURL(url)) {
      return res.status(400).json({ 
        error: 'Unsupported platform. Supported: YouTube, Instagram, Facebook, X/Twitter' 
      });
    }

    const platform = detectPlatform(url);
    console.log(`🔍 Getting video info for ${platform.platform}: ${url}`);
    
    // Use yt-dlp to get video information
    const ytdlp = spawn('/home/shtefko/.local/bin/yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      url
    ]);

    let infoData = '';
    let errorData = '';

    ytdlp.stdout.on('data', (data) => {
      infoData += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to get video information',
          details: errorData.trim() || 'Unknown error'
        });
      }

      try {
        const videoInfo = JSON.parse(infoData);
        
        // Extract available qualities
        const formats = videoInfo.formats || [];
        const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none');
        const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
        
        const qualities = [
          ...new Set([
            ...videoFormats.map(f => {
              if (f.format_note) return f.format_note;
              if (f.height) return `${f.height}p`;
              return f.quality || 'Unknown';
            }).filter(q => q && q !== 'Unknown'),
            'Audio Only'
          ])
        ];

        const response = {
          title: videoInfo.title || 'Unknown Title',
          duration: videoInfo.duration ? videoInfo.duration.toString() : '0',
          thumbnail: videoInfo.thumbnail || '',
          author: videoInfo.uploader || videoInfo.channel || 'Unknown Author',
          viewCount: (videoInfo.view_count || 0).toString(),
          uploadDate: videoInfo.upload_date || new Date().toISOString(),
          description: (videoInfo.description || '').substring(0, 200) + '...',
          availableQualities: qualities,
          platform: platform.platform,
          platformIcon: platform.icon,
          formats: videoFormats.slice(0, 10).map(f => ({
            format_id: f.format_id,
            quality: f.format_note || `${f.height}p` || 'Unknown',
            ext: f.ext,
            filesize: f.filesize
          }))
        };

        res.json(response);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse video information',
          details: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({ 
      error: 'Failed to get video information',
      details: error.message
    });
  }
});

// Download video using yt-dlp
app.post('/api/download', async (req, res) => {
  try {
    const { url, quality = 'best', format = 'mp4' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    if (!validateURL(url)) {
      return res.status(400).json({ 
        error: 'Unsupported platform. Supported: YouTube, Instagram, Facebook, X/Twitter' 
      });
    }

    const downloadId = uuidv4();
    const platform = detectPlatform(url);
    console.log(`🚀 Starting download ${downloadId} from ${platform.platform}: ${url}`);
    
    // Send immediate response
    res.json({ downloadId, message: 'Download started' });

         // Create safe filename
     const timestamp = Date.now();
     const safeFilename = `video_${downloadId}_${timestamp}.%(ext)s`;
     let ytdlArgs = [
       '--no-mtime',
       '--no-playlist',
       '--extractor-retries', '3',
       '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
       '--add-header', 'Accept-Language:en-US,en;q=0.9',
       '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
       '--socket-timeout', '60',
       '--retries', '3',
       '--verbose'
     ];

     // Format selection logic
     if (format === 'mp3') {
       ytdlArgs.push('-f', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio');
       ytdlArgs.push('--extract-audio');
       ytdlArgs.push('--audio-format', 'mp3');
       ytdlArgs.push('--audio-quality', '0');
     } else {
       switch (quality) {
         case 'highest':
           // Get the absolute best quality available - multiple fallback options for maximum quality
           ytdlArgs.push('-f', `bestvideo[height>=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1080]+bestaudio/bestvideo[height>=720]+bestaudio/bestvideo+bestaudio/best[height>=720]/best`);
           console.log('🏆 Selected HIGHEST quality format with multiple fallbacks for maximum resolution');
           break;
         case '720p':
           ytdlArgs.push('-f', `best[ext=${format}][height<=720]/best[height<=720]`);
           break;
         case '480p':
           ytdlArgs.push('-f', `best[ext=${format}][height<=480]/best[height<=480]`);
           break;
         case '360p':
           ytdlArgs.push('-f', `best[ext=${format}][height<=360]/best[height<=360]`);
           break;
         default:
           ytdlArgs.push('-f', `best[ext=${format}]/best[height<=720]/best`);
       }
     }

     const outputPath = path.join(downloadsDir, safeFilename);
    ytdlArgs.push('-o', outputPath);
    ytdlArgs.push(url);

    console.log('🔧 yt-dlp command:', 'yt-dlp', ytdlArgs.join(' '));
    console.log(`🎯 Quality requested: ${quality}, Format: ${format}`);

    const ytdlProcess = spawn('/home/shtefko/.local/bin/yt-dlp', ytdlArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Store download info
    activeDownloads.set(downloadId, {
      id: downloadId,
      url,
      filename: safeFilename.replace('.%(ext)s', `.${format}`),
      outputPath,
      status: 'starting',
      progress: 0,
      platform: platform.platform,
      createdAt: Date.now()
    });

         ytdlProcess.stdout.on('data', (data) => {
       const output = data.toString();
       console.log(`📊 stdout: ${output.trim()}`);
       
       // Log format selection information
       if (output.includes('format code') || output.includes('Selected format')) {
         console.log(`🎥 Format selected: ${output.trim()}`);
       }
       
       // Parse progress information
       if (output.includes('/')) {
         try {
           const parts = output.trim().split('/');
           if (parts.length >= 2) {
             const downloaded = parseInt(parts[0]) || 0;
             const total = parseInt(parts[1]) || 0;
             const progress = total > 0 ? Math.round((downloaded / total) * 100) : 0;
             
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
               message: `Downloading from ${platform.platform}... ${progress}%`
             });
           }
         } catch (err) {
           // Ignore parsing errors
         }
       }
     });

     ytdlProcess.stderr.on('data', (data) => {
       const error = data.toString();
       console.error(`❌ stderr: ${error.trim()}`);
       
       // Log format selection information from stderr
       if (error.includes('format') || error.includes('Available formats') || error.includes('Requested format')) {
         console.log(`🎥 Format info from stderr: ${error.trim()}`);
       }
     });

    ytdlProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Download completed: ${downloadId}`);
        
        // Find the actual output file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(f => f.includes(downloadId));
        
        if (downloadedFile) {
          const actualPath = path.join(downloadsDir, downloadedFile);
          
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            progress: 100,
            status: 'completed',
            filename: downloadedFile,
            outputPath: actualPath
          });

          io.emit('downloadProgress', {
            downloadId,
            progress: 100,
            status: 'completed',
            message: `Download completed from ${platform.platform}!`,
            downloadUrl: `/api/file/${downloadId}`
          });
        } else {
          console.error('Downloaded file not found');
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: 'error',
            error: 'Downloaded file not found'
          });
        }
      } else {
        console.error(`❌ Download error ${downloadId}: Exit code ${code}`);
        
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          status: 'error',
          error: `Download failed with exit code ${code}`
        });

        io.emit('downloadProgress', {
          downloadId,
          progress: 0,
          status: 'error',
          message: `Download failed from ${platform.platform}`
        });
      }
    });

  } catch (error) {
    console.error(`❌ Download error ${downloadId}:`, error.message);
    io.emit('download-error', { 
      downloadId, 
      error: error.message || 'Download failed',
      details: error.stack || 'Unknown error'
    });
    res.status(500).json({ 
      error: 'Download failed', 
      details: error.message,
      downloadId 
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
    filename: download.filename,
    platform: download.platform,
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
  console.log(`📹 Multi-Platform Video Downloader running on port ${PORT}`);
  console.log(`🔗 Real-time progress available via Socket.IO`);
  console.log(`📁 Downloads saved to: ${downloadsDir}`);
  console.log(`🎯 Supported platforms: YouTube 📹 Instagram 📷 Facebook 👥 X/Twitter 🐦`);
});

module.exports = { app, server, io }; 
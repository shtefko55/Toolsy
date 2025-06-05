const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 
      'audio/aac', 'audio/m4a', 'audio/webm', 'audio/mp4',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm|mp4|3gp|amr|wma)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format'), false);
    }
  }
});

// Supported format configurations
const formatConfigs = {
  mp3: {
    codec: 'libmp3lame',
    quality: { low: '96k', medium: '128k', high: '192k', lossless: '320k' }
  },
  wav: {
    codec: 'pcm_s16le',
    quality: { low: '22050', medium: '44100', high: '48000', lossless: '96000' }
  },
  ogg: {
    codec: 'libvorbis',
    quality: { low: '96k', medium: '128k', high: '192k', lossless: '320k' }
  },
  flac: {
    codec: 'flac',
    quality: { low: '44100', medium: '48000', high: '96000', lossless: '192000' }
  },
  aac: {
    codec: 'aac',
    quality: { low: '96k', medium: '128k', high: '192k', lossless: '256k' }
  },
  m4a: {
    codec: 'aac',
    quality: { low: '96k', medium: '128k', high: '192k', lossless: '256k' }
  },
  webm: {
    codec: 'libopus',
    quality: { low: '96k', medium: '128k', high: '192k', lossless: '320k' }
  }
};

// Active conversions tracking
const activeConversions = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg: !!ffmpeg
  });
});

// Get supported formats
app.get('/api/formats', (req, res) => {
  res.json({
    input: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'webm', 'mp4', '3gp', 'amr', 'wma'],
    output: Object.keys(formatConfigs),
    qualities: ['low', 'medium', 'high', 'lossless']
  });
});

// Upload and convert audio file
app.post('/api/convert', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { format = 'mp3', quality = 'high', sampleRate, channels, bitRate } = req.body;
    const conversionId = uuidv4();
    const inputPath = req.file.path;
    const outputFileName = `${path.parse(req.file.filename).name}.${format}`;
    const outputPath = path.join(outputsDir, outputFileName);

    // Validate format
    if (!formatConfigs[format]) {
      fs.removeSync(inputPath);
      return res.status(400).json({ error: `Unsupported output format: ${format}` });
    }

    const config = formatConfigs[format];
    
    // Store conversion info
    activeConversions.set(conversionId, {
      inputPath,
      outputPath,
      originalName: req.file.originalname,
      status: 'processing',
      progress: 0
    });

    // Send initial response
    res.json({
      conversionId,
      message: 'Conversion started',
      originalName: req.file.originalname,
      outputFormat: format
    });

    // Start FFmpeg conversion
    const command = ffmpeg(inputPath)
      .audioCodec(config.codec);

    // Apply quality settings
    if (format === 'wav' || format === 'flac') {
      const sr = sampleRate || config.quality[quality];
      command.audioFrequency(parseInt(sr));
    } else {
      const br = bitRate || config.quality[quality];
      command.audioBitrate(br);
    }

    // Apply additional settings
    if (channels) {
      command.audioChannels(parseInt(channels));
    }

    // Add format-specific options
    if (format === 'flac') {
      command.audioQuality(0); // Lossless
    } else if (format === 'ogg') {
      command.format('ogg');
    } else if (format === 'm4a') {
      command.format('mp4');
    }

    command
      .on('start', (cmdline) => {
        console.log(`Starting conversion ${conversionId}: ${cmdline}`);
        io.emit('conversionProgress', {
          conversionId,
          progress: 5,
          status: 'processing',
          message: 'Conversion started'
        });
      })
      .on('progress', (progress) => {
        const progressPercent = Math.min(Math.floor(progress.percent || 0), 95);
        
        activeConversions.set(conversionId, {
          ...activeConversions.get(conversionId),
          progress: progressPercent
        });

        io.emit('conversionProgress', {
          conversionId,
          progress: progressPercent,
          status: 'processing',
          message: `Converting... ${progressPercent}%`,
          timemark: progress.timemark
        });
      })
      .on('end', () => {
        console.log(`Conversion completed: ${conversionId}`);
        
        activeConversions.set(conversionId, {
          ...activeConversions.get(conversionId),
          status: 'completed',
          progress: 100
        });

        io.emit('conversionProgress', {
          conversionId,
          progress: 100,
          status: 'completed',
          message: 'Conversion completed!',
          downloadUrl: `/api/download/${conversionId}`
        });

        // Clean up input file
        setTimeout(() => {
          fs.removeSync(inputPath);
        }, 1000);
      })
      .on('error', (err) => {
        console.error(`Conversion error ${conversionId}:`, err);
        
        activeConversions.set(conversionId, {
          ...activeConversions.get(conversionId),
          status: 'error',
          error: err.message
        });

        io.emit('conversionProgress', {
          conversionId,
          progress: 0,
          status: 'error',
          message: `Conversion failed: ${err.message}`
        });

        // Clean up files
        fs.removeSync(inputPath);
        fs.removeSync(outputPath).catch(() => {});
      })
      .save(outputPath);

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Conversion failed', 
      details: error.message 
    });
  }
});

// Download converted file
app.get('/api/download/:conversionId', (req, res) => {
  const { conversionId } = req.params;
  const conversion = activeConversions.get(conversionId);

  if (!conversion) {
    return res.status(404).json({ error: 'Conversion not found' });
  }

  if (conversion.status !== 'completed') {
    return res.status(400).json({ error: 'Conversion not completed' });
  }

  if (!fs.existsSync(conversion.outputPath)) {
    return res.status(404).json({ error: 'Output file not found' });
  }

  const fileName = `${path.parse(conversion.originalName).name}_converted${path.extname(conversion.outputPath)}`;
  
  // Handle request abortion
  req.on('aborted', () => {
    console.log(`Download aborted by client: ${conversionId}`);
  });
  
  res.on('close', () => {
    console.log(`Download connection closed: ${conversionId}`);
  });
  
  // Set appropriate headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  try {
    const stats = fs.statSync(conversion.outputPath);
    res.setHeader('Content-Length', stats.size);
  } catch (err) {
    console.error('Error getting file stats:', err);
  }
  
  // Use stream instead of res.download for better control
  const stream = fs.createReadStream(conversion.outputPath);
  
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream error' });
    }
  });
  
  stream.on('end', () => {
    console.log(`Download completed successfully: ${conversionId}`);
    // Clean up output file after successful download
    setTimeout(() => {
      try {
        fs.removeSync(conversion.outputPath);
        activeConversions.delete(conversionId);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 5000);
  });
  
  stream.pipe(res);
});

// Get conversion status
app.get('/api/status/:conversionId', (req, res) => {
  const { conversionId } = req.params;
  const conversion = activeConversions.get(conversionId);

  if (!conversion) {
    return res.status(404).json({ error: 'Conversion not found' });
  }

  res.json({
    conversionId,
    status: conversion.status,
    progress: conversion.progress,
    error: conversion.error
  });
});

// Get file info using FFprobe
app.post('/api/info', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  ffmpeg.ffprobe(req.file.path, (err, metadata) => {
    // Clean up uploaded file
    fs.removeSync(req.file.path);

    if (err) {
      return res.status(400).json({ error: 'Invalid audio file' });
    }

    const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
    
    res.json({
      duration: metadata.format.duration,
      size: metadata.format.size,
      bitRate: metadata.format.bit_rate,
      format: metadata.format.format_name,
      codec: audioStream?.codec_name,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
      channelLayout: audioStream?.channel_layout
    });
  });
});

// Clean up old files periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  // Clean up old conversions
  for (const [id, conversion] of activeConversions.entries()) {
    if (now - conversion.createdAt > maxAge) {
      if (fs.existsSync(conversion.outputPath)) {
        fs.removeSync(conversion.outputPath);
      }
      activeConversions.delete(id);
    }
  }

  // Clean up orphaned files
  [uploadsDir, outputsDir].forEach(dir => {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.removeSync(filePath);
      }
    });
  });
}, 30 * 60 * 1000); // Run every 30 minutes

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 500MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🎵 Audio Conversion Server running on port ${PORT}`);
  console.log(`📊 Real-time progress available via Socket.IO`);
  console.log(`🔧 FFmpeg version: ${ffmpeg().version || 'Available'}`);
  console.log(`📁 Upload limit: 500MB`);
  console.log(`🎯 Supported formats: ${Object.keys(formatConfigs).join(', ')}`);
});

module.exports = { app, server, io }; 
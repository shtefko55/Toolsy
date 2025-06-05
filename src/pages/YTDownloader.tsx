import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import io, { Socket } from 'socket.io-client';

interface VideoInfo {
  title: string;
  duration: string;
  thumbnail: string;
  author: string;
  viewCount: string;
  uploadDate: string;
  description: string;
  availableQualities: string[];
}

interface DownloadStatus {
  downloadId: string;
  progress: number;
  status: 'starting' | 'downloading' | 'completed' | 'error';
  message: string;
  downloadUrl?: string;
  error?: string;
}

const YTDownloader = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('highest');
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isGettingInfo, setIsGettingInfo] = useState(false);

  const BACKEND_URL = 'http://localhost:3002';

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('🔗 Connecting to YouTube Downloader server...');
    
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      setServerStatus('connected');
      console.log('✅ Connected to YouTube Downloader server');
      toast({
        title: "YT Server Connected ✅",
        description: "YouTube downloader is ready",
      });
    });

    socketRef.current.on('connect_error', (error) => {
      setServerStatus('disconnected');
      console.error('❌ YT Server connection error:', error);
      toast({
        title: "YT Server Error ❌",
        description: "Failed to connect to YouTube downloader",
      });
    });

    socketRef.current.on('disconnect', (reason) => {
      setServerStatus('disconnected');
      console.log('🔌 Disconnected from YT server:', reason);
    });

    socketRef.current.on('downloadProgress', (data) => {
      console.log('📊 Download progress:', data);
      setDownloadStatus(prev => prev ? { ...prev, ...data } : data);
      
      // Auto-download when completed
      if (data.status === 'completed' && data.downloadUrl) {
        console.log('🔗 Auto-downloading video file:', data.downloadUrl);
        
        setTimeout(() => {
          const downloadUrl = `${BACKEND_URL}${data.downloadUrl}`;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `youtube_video_${Date.now()}.${selectedFormat}`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Complete 📥",
            description: "Your YouTube video has been downloaded",
          });
        }, 1000);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const getVideoInfo = async () => {
    if (!url.trim()) {
      toast({
        title: "Invalid URL ❌",
        description: "Please enter a YouTube URL",
      });
      return;
    }

    setIsGettingInfo(true);
    setVideoInfo(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/video-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const info = await response.json();
      setVideoInfo(info);
      
      toast({
        title: "Video Info Loaded ✅",
        description: `Found: ${info.title}`,
      });

    } catch (error) {
      console.error('Failed to get video info:', error);
      toast({
        title: "Error Getting Video Info ❌",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsGettingInfo(false);
    }
  };

  const startDownload = async () => {
    if (!videoInfo || serverStatus !== 'connected') {
      toast({
        title: "Cannot Start Download ❌",
        description: "Please get video info first and ensure server is connected",
      });
      return;
    }

    setDownloadStatus({
      downloadId: '',
      progress: 0,
      status: 'starting',
      message: 'Initializing download...'
    });

    try {
      const response = await fetch(`${BACKEND_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          quality: selectedQuality,
          format: selectedFormat
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setDownloadStatus({
        downloadId: result.downloadId,
        progress: 5,
        status: 'starting',
        message: 'Download request sent! Starting...'
      });

      toast({
        title: "Download Started 🚀",
        description: `Downloading: ${videoInfo.title}`,
      });

    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus({
        downloadId: '',
        progress: 0,
        status: 'error',
        message: `Failed to start download: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      toast({
        title: "Download Failed ❌",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const resetDownloader = () => {
    setUrl('');
    setVideoInfo(null);
    setDownloadStatus(null);
    setSelectedQuality('highest');
    setSelectedFormat('mp4');
  };

  const formatDuration = (seconds: string) => {
    const num = parseInt(seconds);
    const hours = Math.floor(num / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    const secs = num % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!downloadStatus) return '#c0c0c0';
    switch (downloadStatus.status) {
      case 'completed': return '#008000';
      case 'error': return '#ff0000';
      case 'downloading': return '#0000ff';
      default: return '#808080';
    }
  };

  return (
    <div className="h-screen bg-gray-300 p-1" style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
      {/* Window Frame */}
      <div className="h-full bg-gray-300 border-2 border-gray-400" style={{
        borderTopColor: '#ffffff',
        borderLeftColor: '#ffffff',
        borderRightColor: '#808080',
        borderBottomColor: '#808080'
      }}>
        
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-2 py-1 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">📺</span>
            <span className="font-bold">YT DW - YouTube Downloader</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => navigate('/')}
              className="w-4 h-4 bg-gray-300 border border-gray-600 text-black text-xs flex items-center justify-center hover:bg-gray-400"
              style={{ fontSize: '10px' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="bg-gray-300 border-b border-gray-600 px-2 py-1 text-xs">
          <span className="hover:bg-blue-600 hover:text-white px-2 py-1 cursor-pointer">File</span>
          <span className="hover:bg-blue-600 hover:text-white px-2 py-1 cursor-pointer">Edit</span>
          <span className="hover:bg-blue-600 hover:text-white px-2 py-1 cursor-pointer">View</span>
          <span className="hover:bg-blue-600 hover:text-white px-2 py-1 cursor-pointer">Help</span>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-300 border-b border-gray-600 px-3 py-2 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              serverStatus === 'connected' ? 'bg-green-500' : 
              serverStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span>Server: {serverStatus}</span>
          </div>
          <span>Ready</span>
        </div>

        {/* Main Content */}
        <div className="p-4 h-full overflow-auto">
          
          {/* URL Input Section */}
          <div className="bg-gray-300 border-2 border-gray-600 p-3 mb-4" style={{
            borderTopColor: '#808080',
            borderLeftColor: '#808080',
            borderRightColor: '#ffffff',
            borderBottomColor: '#ffffff'
          }}>
            <div className="text-sm font-bold mb-2">📋 YouTube URL:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-2 py-1 border-2 border-gray-600 text-sm"
                style={{
                  borderTopColor: '#808080',
                  borderLeftColor: '#808080',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff'
                }}
              />
              <button
                onClick={getVideoInfo}
                disabled={isGettingInfo || !url.trim()}
                className="px-4 py-1 bg-gray-300 border-2 border-gray-600 text-sm hover:bg-gray-400 disabled:opacity-50"
                style={{
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#808080',
                  borderBottomColor: '#808080'
                }}
              >
                {isGettingInfo ? '🔍 Loading...' : '🔍 Get Info'}
              </button>
            </div>
          </div>

          {/* Video Info Section */}
          {videoInfo && (
            <div className="bg-gray-300 border-2 border-gray-600 p-3 mb-4" style={{
              borderTopColor: '#808080',
              borderLeftColor: '#808080',
              borderRightColor: '#ffffff',
              borderBottomColor: '#ffffff'
            }}>
              <div className="text-sm font-bold mb-2">📺 Video Information:</div>
              <div className="flex gap-4">
                <img 
                  src={videoInfo.thumbnail} 
                  alt="Thumbnail"
                  className="w-24 h-18 border border-gray-600"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold mb-1">{videoInfo.title}</div>
                  <div>👤 {videoInfo.author}</div>
                  <div>⏱️ {formatDuration(videoInfo.duration)}</div>
                  <div>👀 {parseInt(videoInfo.viewCount).toLocaleString()} views</div>
                  <div className="mt-2 text-gray-600">{videoInfo.description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Download Options */}
          {videoInfo && (
            <div className="bg-gray-300 border-2 border-gray-600 p-3 mb-4" style={{
              borderTopColor: '#808080',
              borderLeftColor: '#808080',
              borderRightColor: '#ffffff',
              borderBottomColor: '#ffffff'
            }}>
              <div className="text-sm font-bold mb-2">⚙️ Download Options:</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold">Quality:</label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="w-full mt-1 px-2 py-1 border-2 border-gray-600 text-xs"
                    style={{
                      borderTopColor: '#808080',
                      borderLeftColor: '#808080',
                      borderRightColor: '#ffffff',
                      borderBottomColor: '#ffffff'
                    }}
                  >
                    <option value="highest">🏆 Highest Quality</option>
                    <option value="720p">📺 720p HD</option>
                    <option value="480p">📱 480p SD</option>
                    <option value="360p">💾 360p</option>
                    <option value="audio">🎵 Audio Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold">Format:</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full mt-1 px-2 py-1 border-2 border-gray-600 text-xs"
                    style={{
                      borderTopColor: '#808080',
                      borderLeftColor: '#808080',
                      borderRightColor: '#ffffff',
                      borderBottomColor: '#ffffff'
                    }}
                  >
                    <option value="mp4">📹 MP4 Video</option>
                    <option value="webm">🌐 WebM Video</option>
                    {selectedQuality === 'audio' && <option value="mp3">🎵 MP3 Audio</option>}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Download Progress */}
          {downloadStatus && (
            <div className="bg-gray-300 border-2 border-gray-600 p-3 mb-4" style={{
              borderTopColor: '#808080',
              borderLeftColor: '#808080',
              borderRightColor: '#ffffff',
              borderBottomColor: '#ffffff'
            }}>
              <div className="text-sm font-bold mb-2">📊 Download Progress:</div>
              <div className="text-xs mb-2" style={{ color: getStatusColor() }}>
                {downloadStatus.message}
              </div>
              <div className="bg-gray-400 border-2 border-gray-600 h-6 mb-2" style={{
                borderTopColor: '#808080',
                borderLeftColor: '#808080',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff'
              }}>
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${downloadStatus.progress}%` }}
                />
              </div>
              <div className="text-xs text-center">{downloadStatus.progress}% Complete</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={startDownload}
              disabled={!videoInfo || serverStatus !== 'connected' || (downloadStatus?.status === 'downloading')}
              className="px-6 py-2 bg-gray-300 border-2 border-gray-600 text-sm hover:bg-gray-400 disabled:opacity-50"
              style={{
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}
            >
              📥 Start Download
            </button>
            <button
              onClick={resetDownloader}
              className="px-6 py-2 bg-gray-300 border-2 border-gray-600 text-sm hover:bg-gray-400"
              style={{
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-gray-300 border-t border-gray-600 px-3 py-1 text-xs flex justify-between items-center">
          <span>YT DW v1.0 - Educational Use Only</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default YTDownloader; 
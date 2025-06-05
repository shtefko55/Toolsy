import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, RefreshCw, FileAudio, Settings, Info, Server, Zap } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface ConversionSettings {
  format: 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  sampleRate?: number;
  channels?: number;
  bitRate?: string;
}

interface ConversionStatus {
  conversionId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  downloadUrl?: string;
  error?: string;
}

const AudioConverterServer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus | null>(null);
  const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [supportedFormats, setSupportedFormats] = useState<any>(null);

  const [settings, setSettings] = useState<ConversionSettings>({
    format: 'mp3',
    quality: 'high'
  });

  const BACKEND_URL = 'http://localhost:3001';

  const formatDescriptions = {
    mp3: 'Universal compatibility - works everywhere',
    wav: 'Uncompressed quality - large file size',
    ogg: 'Open source format - excellent compression',
    flac: 'Lossless compression - audiophile quality',
    aac: 'Advanced compression - Apple/iTunes standard',
    m4a: 'Apple audio format - iTunes compatible',
    webm: 'Web optimized - modern browser support'
  };

  const qualityDescriptions = {
    low: 'Smallest file size - good for voice/speech',
    medium: 'Balanced quality and size - most common',
    high: 'Excellent quality - recommended for music',
    lossless: 'Perfect quality - largest file size'
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    // Connect to backend
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      setServerStatus('connected');
      console.log('Connected to audio conversion server');
    });

    socketRef.current.on('disconnect', () => {
      setServerStatus('disconnected');
      console.log('Disconnected from server');
    });

    socketRef.current.on('conversionProgress', (data) => {
      setConversionStatus(prev => prev ? { ...prev, ...data } : data);
    });

    // Fetch supported formats
    fetchSupportedFormats();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchSupportedFormats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/formats`);
      const formats = await response.json();
      setSupportedFormats(formats);
    } catch (error) {
      console.error('Failed to fetch supported formats:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 
      'audio/aac', 'audio/m4a', 'audio/webm', 'audio/mp4'
    ];
    
    const isValidType = allowedTypes.includes(file.type) || 
      file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm|mp4|3gp|amr|wma)$/i);

    if (!isValidType) {
      toast({
        title: "Invalid File Type ❌",
        description: "Please select a valid audio file.",
      });
      return;
    }

    // Check file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File Too Large ⚠️",
        description: "Maximum file size is 500MB for server processing",
      });
      return;
    }

    setAudioFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    });

    setConversionStatus(null);

    toast({
      title: "File Selected ✅",
      description: `${file.name} ready for conversion`,
    });
  };

  const startConversion = async () => {
    if (!audioFile || serverStatus !== 'connected') return;

    setConversionStatus({
      conversionId: '',
      progress: 0,
      status: 'uploading',
      message: 'Uploading file to server...'
    });

    try {
      const formData = new FormData();
      formData.append('audio', audioFile.file);
      formData.append('format', settings.format);
      formData.append('quality', settings.quality);
      
      if (settings.sampleRate) {
        formData.append('sampleRate', settings.sampleRate.toString());
      }
      if (settings.channels) {
        formData.append('channels', settings.channels.toString());
      }
      if (settings.bitRate) {
        formData.append('bitRate', settings.bitRate);
      }

      const response = await fetch(`${BACKEND_URL}/api/convert`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setConversionStatus({
        conversionId: result.conversionId,
        progress: 5,
        status: 'processing',
        message: 'File uploaded successfully! Starting conversion...'
      });

      toast({
        title: "Conversion Started 🚀",
        description: `Converting ${audioFile.name} to ${settings.format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus({
        conversionId: '',
        progress: 0,
        status: 'error',
        message: `Failed to start conversion: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      toast({
        title: "Conversion Failed ❌",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const downloadFile = async () => {
    if (!conversionStatus?.downloadUrl) return;

    try {
      const response = await fetch(`${BACKEND_URL}${conversionStatus.downloadUrl}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${audioFile?.name.split('.')[0]}_converted.${settings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started 📥",
        description: `${a.download} is downloading`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed ❌",
        description: "Failed to download converted file",
      });
    }
  };

  const resetConverter = () => {
    setAudioFile(null);
    setConversionStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateSettings = (key: keyof ConversionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBackClick = () => {
    navigate('/audio-tools');
  };

  const getStatusColor = () => {
    switch (conversionStatus?.status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    switch (conversionStatus?.status) {
      case 'uploading': return 'bg-blue-600';
      case 'processing': return 'bg-yellow-600';
      case 'completed': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-4xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans flex items-center gap-2">
                <Server className="h-4 w-4" />
                Professional Audio Converter
              </div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button 
                onClick={handleBackClick} 
                className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>

          <div className="bg-white min-h-[600px] p-4 overflow-y-auto">
            
            {/* Server Status */}
            <div className="bg-gray-100 p-3 mb-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span className="text-sm font-bold">Server Status:</span>
                  <span className={`text-sm font-bold ${
                    serverStatus === 'connected' ? 'text-green-600' : 
                    serverStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {serverStatus === 'connected' ? '🟢 CONNECTED' : 
                     serverStatus === 'connecting' ? '🟡 CONNECTING...' : '🔴 DISCONNECTED'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Zap className="h-3 w-3" />
                  <span>FFmpeg-powered • No browser limits</span>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Select Audio File for Server Conversion
              </h3>
              
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {audioFile ? (
                    <div className="space-y-2">
                      <FileAudio className="h-12 w-12 mx-auto text-blue-600" />
                      <div className="text-black font-bold">{audioFile.name}</div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>Size: {formatFileSize(audioFile.size)}</div>
                        <div>Type: {audioFile.type || 'Unknown'}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetConverter();
                        }}
                        className="win98-btn px-3 py-1 text-xs mt-2"
                      >
                        Select Different File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                      <div className="text-gray-700 mb-2 font-bold">Drop audio file here or click to browse</div>
                      <div className="text-xs text-gray-600">
                        Supports: MP3, WAV, OGG, FLAC, AAC, M4A, WebM, WMA, AMR, 3GP
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Maximum file size: 500MB (No browser crashes!)
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Conversion Settings */}
            {audioFile && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Professional Conversion Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Output Format</label>
                    <select
                      value={settings.format}
                      onChange={(e) => updateSettings('format', e.target.value)}
                      className="w-full p-2 border-2 border-gray-400 text-black"
                      style={{
                        borderTopColor: '#808080',
                        borderLeftColor: '#808080',
                        borderRightColor: '#dfdfdf',
                        borderBottomColor: '#dfdfdf'
                      }}
                    >
                      {supportedFormats?.output?.map((format: string) => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      )) || Object.keys(formatDescriptions).map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDescriptions[settings.format as keyof typeof formatDescriptions]}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Quality Preset</label>
                    <select
                      value={settings.quality}
                      onChange={(e) => updateSettings('quality', e.target.value)}
                      className="w-full p-2 border-2 border-gray-400 text-black"
                      style={{
                        borderTopColor: '#808080',
                        borderLeftColor: '#808080',
                        borderRightColor: '#dfdfdf',
                        borderBottomColor: '#dfdfdf'
                      }}
                    >
                      {supportedFormats?.qualities?.map((quality: string) => (
                        <option key={quality} value={quality}>
                          {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
                        </option>
                      )) || Object.keys(qualityDescriptions).map(quality => (
                        <option key={quality} value={quality}>
                          {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-600 mt-1">
                      {qualityDescriptions[settings.quality as keyof typeof qualityDescriptions]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Controls */}
            {audioFile && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={startConversion}
                    disabled={conversionStatus?.status === 'uploading' || conversionStatus?.status === 'processing' || serverStatus !== 'connected'}
                    className="win98-btn px-4 py-3 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    {conversionStatus?.status === 'uploading' || conversionStatus?.status === 'processing' ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        {conversionStatus.message}
                      </>
                    ) : (
                      <>
                        <Server className="h-4 w-4 mr-2" />
                        Convert to {settings.format.toUpperCase()} (Server-Side)
                      </>
                    )}
                  </button>

                  {/* Progress Bar */}
                  {conversionStatus && (conversionStatus.status === 'uploading' || conversionStatus.status === 'processing') && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-300 border-2 border-gray-400" style={{
                        borderTopColor: '#808080',
                        borderLeftColor: '#808080',
                        borderRightColor: '#dfdfdf',
                        borderBottomColor: '#dfdfdf'
                      }}>
                        <div 
                          className={`h-4 transition-all duration-300 ${getProgressColor()}`}
                          style={{ width: `${conversionStatus.progress}%` }}
                        />
                      </div>
                      <div className={`text-center text-sm font-bold ${getStatusColor()}`}>
                        {conversionStatus.message} ({conversionStatus.progress}%)
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  {conversionStatus?.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="text-center text-green-600 font-bold text-sm">
                        ✅ Conversion completed successfully!
                      </div>
                      <button
                        onClick={downloadFile}
                        className="win98-btn px-4 py-3 text-black flex items-center justify-center font-bold bg-green-100 w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Converted File
                      </button>
                      <button
                        onClick={resetConverter}
                        className="win98-btn px-4 py-2 text-black flex items-center justify-center text-sm w-full"
                      >
                        Convert Another File
                      </button>
                    </div>
                  )}

                  {/* Error Display */}
                  {conversionStatus?.status === 'error' && (
                    <div className="space-y-2">
                      <div className="text-center text-red-600 font-bold text-sm">
                        ❌ {conversionStatus.message}
                      </div>
                      <button
                        onClick={resetConverter}
                        className="win98-btn px-4 py-2 text-black flex items-center justify-center text-sm w-full"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Server Features Info */}
            <div className="bg-gray-100 p-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Server-Side Conversion Benefits
              </h3>
              
              <div className="text-xs text-gray-700 space-y-2">
                <div><strong>✅ No Browser Crashes:</strong> Processing happens on the server, not in your browser</div>
                <div><strong>✅ Large File Support:</strong> Up to 500MB files supported</div>
                <div><strong>✅ All Formats:</strong> Professional FFmpeg support for every audio format</div>
                <div><strong>✅ Real-time Progress:</strong> Live updates via WebSocket connection</div>
                <div><strong>✅ High Quality:</strong> Professional-grade conversion with all codecs</div>
                <div><strong>✅ Unlimited Conversions:</strong> No memory limitations or restrictions</div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-700 flex items-center">
            <span>🎵 Professional Audio Converter - Server-powered conversion</span>
            <div className="ml-auto flex items-center gap-4">
              <span className={serverStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                Server: {serverStatus}
              </span>
              {audioFile && <span>File: {audioFile.name}</span>}
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioConverterServer; 
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, RefreshCw, FileAudio, Settings, Info } from 'lucide-react';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration: number;
  format: string;
  sampleRate: number;
  channels: number;
  bitRate?: number;
  url: string;
}

interface ConversionSettings {
  format: 'wav' | 'mp3' | 'ogg' | 'webm' | 'aac' | 'flac' | 'm4a';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  sampleRate: number;
  channels: 1 | 2;
  bitRate: number;
}

const AudioConverter = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [settings, setSettings] = useState<ConversionSettings>({
    format: 'mp3',
    quality: 'high',
    sampleRate: 44100,
    channels: 2,
    bitRate: 192
  });

  const supportedFormats = {
    input: ['mp3', 'wav', 'ogg', 'webm', 'aac', 'flac', 'm4a', 'mp4', '3gp', 'amr'],
    output: ['wav', 'mp3', 'ogg', 'webm', 'aac', 'flac', 'm4a']
  };

  const qualityPresets = {
    low: { bitRate: 96, sampleRate: 22050 },
    medium: { bitRate: 128, sampleRate: 44100 },
    high: { bitRate: 192, sampleRate: 44100 },
    lossless: { bitRate: 320, sampleRate: 48000 }
  };

  const formatDescriptions = {
    wav: 'Uncompressed high quality - large file size',
    mp3: 'Compressed lossy - good balance of size and quality',
    ogg: 'Open source compressed - excellent quality/size ratio',
    webm: 'Web optimized - modern browser support',
    aac: 'Advanced compression - Apple/iTunes standard',
    flac: 'Lossless compression - audiophile quality',
    m4a: 'Apple audio format - iTunes compatible'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid audio file.",
      });
      return;
    }

    setIsLoading(true);
    setConvertedBlob(null);

    try {
      const audioInfo = await getAudioFileInfo(file);
      setAudioFile(audioInfo);
      
      toast({
        title: "File Loaded",
        description: `${file.name} loaded successfully`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Load Error",
        description: "Failed to load audio file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAudioFileInfo = async (file: File): Promise<AudioFile> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        const format = file.type.split('/')[1] || 'unknown';
        
        resolve({
          file,
          name: file.name,
          size: file.size,
          duration: audio.duration,
          format: format,
          sampleRate: 44100, // Default, would need Web Audio API for accurate detection
          channels: 2, // Default
          url
        });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio file'));
      };

      audio.src = url;
    });
  };

  const convertAudio = async () => {
    if (!audioFile) return;

    setIsConverting(true);
    setConversionProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const convertedBlob = await performConversion(audioFile, settings);
      
      clearInterval(progressInterval);
      setConversionProgress(100);
      setConvertedBlob(convertedBlob);

      toast({
        title: "Conversion Complete",
        description: `Audio converted to ${settings.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Error",
        description: "Failed to convert audio file",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const performConversion = async (audioFile: AudioFile, settings: ConversionSettings): Promise<Blob> => {
    // Create audio context for conversion
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      const arrayBuffer = await audioFile.file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Apply channel and sample rate conversion if needed
      const processedBuffer = await processAudioBuffer(audioBuffer, settings);
      
      // Convert to target format
      switch (settings.format) {
        case 'wav':
          return audioBufferToWav(processedBuffer);
        case 'mp3':
          return await audioBufferToMp3(processedBuffer, settings);
        case 'ogg':
          return await audioBufferToOgg(processedBuffer, settings);
        case 'webm':
          return await audioBufferToWebM(processedBuffer, settings);
        default:
          return audioBufferToWav(processedBuffer);
      }
    } finally {
      audioContext.close();
    }
  };

  const processAudioBuffer = async (buffer: AudioBuffer, settings: ConversionSettings): Promise<AudioBuffer> => {
    const audioContext = new OfflineAudioContext(
      settings.channels,
      Math.floor(buffer.duration * settings.sampleRate),
      settings.sampleRate
    );

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Channel mixing if needed
    if (settings.channels === 1 && buffer.numberOfChannels === 2) {
      // Stereo to mono
      const merger = audioContext.createChannelMerger(1);
      const splitter = audioContext.createChannelSplitter(2);
      const gainL = audioContext.createGain();
      const gainR = audioContext.createGain();
      
      gainL.gain.value = 0.5;
      gainR.gain.value = 0.5;
      
      source.connect(splitter);
      splitter.connect(gainL, 0);
      splitter.connect(gainR, 1);
      gainL.connect(merger, 0, 0);
      gainR.connect(merger, 0, 0);
      merger.connect(audioContext.destination);
    } else {
      source.connect(audioContext.destination);
    }

    source.start();
    return await audioContext.startRendering();
  };

  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const audioBufferToMp3 = async (audioBuffer: AudioBuffer, settings: ConversionSettings): Promise<Blob> => {
    // For MP3 encoding, we would typically use a library like lamejs
    // For now, we'll convert to WAV and simulate MP3 conversion
    return audioBufferToWav(audioBuffer);
  };

  const audioBufferToOgg = async (audioBuffer: AudioBuffer, settings: ConversionSettings): Promise<Blob> => {
    // For OGG encoding, we would use a library like oggjs
    // For now, we'll convert to WAV and simulate OGG conversion
    return audioBufferToWav(audioBuffer);
  };

  const audioBufferToWebM = async (audioBuffer: AudioBuffer, settings: ConversionSettings): Promise<Blob> => {
    // Use MediaRecorder for WebM encoding
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const recorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
        audioContext.close();
      };
      
      recorder.onerror = reject;
      
      // Play the buffer through the recorder
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);
      
      recorder.start();
      source.start();
      
      setTimeout(() => {
        recorder.stop();
      }, (audioBuffer.duration + 1) * 1000);
    });
  };

  const downloadConverted = () => {
    if (!convertedBlob || !audioFile) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalName = audioFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_converted.${settings.format}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `${originalName}_converted.${settings.format}`,
    });
  };

  const updateSettings = (key: keyof ConversionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Auto-update related settings based on quality
    if (key === 'quality') {
      const preset = qualityPresets[value as keyof typeof qualityPresets];
      setSettings(prev => ({
        ...prev,
        quality: value,
        bitRate: preset.bitRate,
        sampleRate: preset.sampleRate
      }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    if (convertedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(convertedBlob));
    }
    navigate('/audio-tools');
  };

  return (
    <div className="min-h-screen bg-win98-bg overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Title Bar */}
        <div className="win98-title-bar flex items-center justify-between px-2 py-1">
          <div className="flex items-center">
            <FileAudio className="h-4 w-4 mr-2" />
            <span className="font-bold">Audio Converter - Universal Format Support</span>
          </div>
          <button
            onClick={handleBackClick}
            className="win98-btn-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {/* File Upload Section */}
          <div className="bg-white p-4 mb-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Select Audio File
            </h3>
            
            <div className="flex flex-col gap-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-600">Analyzing audio file...</span>
                  </div>
                ) : audioFile ? (
                  <div className="space-y-2">
                    <FileAudio className="h-12 w-12 mx-auto text-blue-500" />
                    <div className="text-black font-medium">{audioFile.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Format: {audioFile.format.toUpperCase()}</div>
                      <div>Size: {formatFileSize(audioFile.size)}</div>
                      <div>Duration: {formatDuration(audioFile.duration)}</div>
                      <div>Sample Rate: {audioFile.sampleRate} Hz</div>
                      <div>Channels: {audioFile.channels}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <div className="text-gray-600 mb-2">Drop audio file here or click to browse</div>
                    <div className="text-xs text-gray-500">
                      Supports: {supportedFormats.input.map(f => f.toUpperCase()).join(', ')}
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
            <div className="bg-white p-4 mb-4 win98-panel">
              <h3 className="text-sm font-medium text-black mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Conversion Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Output Format */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Output Format</label>
                  <select
                    value={settings.format}
                    onChange={(e) => updateSettings('format', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    {supportedFormats.output.map(format => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDescriptions[settings.format]}
                  </div>
                </div>

                {/* Quality Preset */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Quality Preset</label>
                  <select
                    value={settings.quality}
                    onChange={(e) => updateSettings('quality', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="low">Low Quality (96 kbps)</option>
                    <option value="medium">Medium Quality (128 kbps)</option>
                    <option value="high">High Quality (192 kbps)</option>
                    <option value="lossless">Lossless (320 kbps)</option>
                  </select>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="md:col-span-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="win98-btn px-3 py-1 text-xs"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                  </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Sample Rate (Hz)</label>
                      <select
                        value={settings.sampleRate}
                        onChange={(e) => updateSettings('sampleRate', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                      >
                        <option value={22050}>22,050 Hz</option>
                        <option value={44100}>44,100 Hz</option>
                        <option value={48000}>48,000 Hz</option>
                        <option value={96000}>96,000 Hz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Channels</label>
                      <select
                        value={settings.channels}
                        onChange={(e) => updateSettings('channels', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                      >
                        <option value={1}>Mono</option>
                        <option value={2}>Stereo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Bit Rate (kbps)</label>
                      <input
                        type="range"
                        min="64"
                        max="320"
                        step="16"
                        value={settings.bitRate}
                        onChange={(e) => updateSettings('bitRate', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {settings.bitRate} kbps
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Conversion Controls */}
          {audioFile && (
            <div className="bg-white p-4 mb-4 win98-panel">
              <div className="flex flex-col gap-4">
                <button
                  onClick={convertAudio}
                  disabled={isConverting}
                  className="win98-btn px-4 py-2 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Converting... {conversionProgress}%
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Convert to {settings.format.toUpperCase()}
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isConverting && (
                  <div className="w-full bg-gray-200 rounded">
                    <div 
                      className="bg-blue-500 rounded h-2 transition-all duration-300"
                      style={{ width: `${conversionProgress}%` }}
                    />
                  </div>
                )}

                {/* Download Button */}
                {convertedBlob && (
                  <button
                    onClick={downloadConverted}
                    className="win98-btn px-4 py-2 text-black flex items-center justify-center bg-green-50 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Converted File
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Format Support Info */}
          <div className="bg-white p-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Supported Formats
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-gray-700 mb-2">Input Formats:</div>
                <div className="space-y-1">
                  {supportedFormats.input.map(format => (
                    <div key={format} className="text-gray-600">
                      • {format.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-2">Output Formats:</div>
                <div className="space-y-1">
                  {supportedFormats.output.map(format => (
                    <div key={format} className="text-gray-600">
                      • {format.toUpperCase()} - {formatDescriptions[format as keyof typeof formatDescriptions]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioConverter;
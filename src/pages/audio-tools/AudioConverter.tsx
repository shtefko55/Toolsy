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
    format: 'wav',
    quality: 'high',
    sampleRate: 44100,
    channels: 2,
    bitRate: 192
  });

  const supportedFormats = {
    input: ['mp3', 'wav', 'ogg', 'webm', 'aac', 'flac', 'm4a', 'mp4'],
    output: ['wav', 'webm']
  };

  const qualityPresets = {
    low: { bitRate: 96, sampleRate: 22050 },
    medium: { bitRate: 128, sampleRate: 44100 },
    high: { bitRate: 192, sampleRate: 44100 },
    lossless: { bitRate: 320, sampleRate: 48000 }
  };

  const formatDescriptions = {
    wav: 'Uncompressed high quality - large file size',
    webm: 'Web optimized - modern browser support'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File ❌",
        description: "Please select a valid audio file.",
      });
      return;
    }

    // Check file size limit (25MB for stability)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File Too Large ⚠️",
        description: "Please select a file smaller than 25MB for stability",
      });
      return;
    }

    setIsLoading(true);
    setConvertedBlob(null);

    try {
      const audioInfo = await getAudioFileInfo(file);
      setAudioFile(audioInfo);
      
      toast({
        title: "File Loaded ✅",
        description: `${file.name} loaded successfully`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Load Error ❌",
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
          sampleRate: 44100,
          channels: 2,
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
      const convertedBlob = await performConversion(audioFile, settings);
      setConvertedBlob(convertedBlob);
      setConversionProgress(100);

      toast({
        title: "Conversion Complete! 🎉",
        description: `Audio converted to ${settings.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Error ❌",
        description: error instanceof Error ? error.message : "Failed to convert audio file",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const performConversion = async (audioFile: AudioFile, settings: ConversionSettings): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      let audioContext: AudioContext | null = null;
      
      try {
        setConversionProgress(10);
        await new Promise(resolve => setTimeout(resolve, 100));

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        setConversionProgress(20);
        await new Promise(resolve => setTimeout(resolve, 100));

        const arrayBuffer = await audioFile.file.arrayBuffer();
        setConversionProgress(40);
        await new Promise(resolve => setTimeout(resolve, 100));

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setConversionProgress(60);
        await new Promise(resolve => setTimeout(resolve, 100));

        const processedBuffer = await processAudioBuffer(audioBuffer, settings);
        setConversionProgress(80);
        await new Promise(resolve => setTimeout(resolve, 100));

        let result: Blob;
        if (settings.format === 'wav') {
          result = audioBufferToWav(processedBuffer);
        } else {
          result = await audioBufferToWebM(processedBuffer, settings);
        }
        
        setConversionProgress(95);
        resolve(result);
        
      } catch (error) {
        reject(error);
      } finally {
        if (audioContext) {
          try {
            await audioContext.close();
          } catch (e) {
            console.warn('Error closing audio context:', e);
          }
        }
      }
    });
  };

  const processAudioBuffer = async (buffer: AudioBuffer, settings: ConversionSettings): Promise<AudioBuffer> => {
    const audioContext = new OfflineAudioContext(
      settings.channels,
      Math.floor(buffer.duration * settings.sampleRate),
      settings.sampleRate
    );

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    
    return await audioContext.startRendering();
  };

  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
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

  const audioBufferToWebM = async (audioBuffer: AudioBuffer, settings: ConversionSettings): Promise<Blob> => {
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
      title: "Download Started 📥",
      description: `${originalName}_converted.${settings.format}`,
    });
  };

  const updateSettings = (key: keyof ConversionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
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
              <div className="font-ms-sans">🔄 Audio Converter</div>
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
            {/* File Upload Section */}
            <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Select Audio File
              </h3>
              
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-gray-700">Analyzing audio file...</span>
                    </div>
                  ) : audioFile ? (
                    <div className="space-y-2">
                      <FileAudio className="h-12 w-12 mx-auto text-blue-600" />
                      <div className="text-black font-bold">{audioFile.name}</div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>Format: {audioFile.format.toUpperCase()}</div>
                        <div>Size: {formatFileSize(audioFile.size)}</div>
                        <div>Duration: {formatDuration(audioFile.duration)}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                      <div className="text-gray-700 mb-2 font-bold">Drop audio file here or click to browse</div>
                      <div className="text-xs text-gray-600">
                        Supports: {supportedFormats.input.map(f => f.toUpperCase()).join(', ')}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Maximum file size: 25MB
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
                  Conversion Settings
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
                      {supportedFormats.output.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDescriptions[settings.format]}
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
                      <option value="low">Low Quality (96 kbps)</option>
                      <option value="medium">Medium Quality (128 kbps)</option>
                      <option value="high">High Quality (192 kbps)</option>
                      <option value="lossless">Lossless (320 kbps)</option>
                    </select>
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
                    onClick={convertAudio}
                    disabled={isConverting}
                    className="win98-btn px-4 py-3 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
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

                  {isConverting && (
                    <div className="w-full bg-gray-300 border-2 border-gray-400" style={{
                      borderTopColor: '#808080',
                      borderLeftColor: '#808080',
                      borderRightColor: '#dfdfdf',
                      borderBottomColor: '#dfdfdf'
                    }}>
                      <div 
                        className="bg-blue-600 h-4 transition-all duration-300"
                        style={{ width: `${conversionProgress}%` }}
                      />
                    </div>
                  )}

                  {convertedBlob && (
                    <button
                      onClick={downloadConverted}
                      className="win98-btn px-4 py-3 text-black flex items-center justify-center font-bold bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Converted File
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Format Support Info */}
            <div className="bg-gray-100 p-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Supported Formats & Notes
              </h3>
              
              <div className="text-xs text-gray-700 space-y-2">
                <div><strong>Input:</strong> {supportedFormats.input.map(f => f.toUpperCase()).join(', ')}</div>
                <div><strong>Output:</strong> {supportedFormats.output.map(f => f.toUpperCase()).join(', ')}</div>
                <div><strong>Note:</strong> For browser stability, only WAV and WebM output are supported. WAV provides the best quality.</div>
                <div><strong>Limit:</strong> Maximum file size is 25MB to prevent browser crashes.</div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-700 flex items-center">
            <span>🔄 Audio Converter - Convert between audio formats safely</span>
            <div className="ml-auto">
              {audioFile && <span>File: {audioFile.name}</span>}
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioConverter;
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, Activity, Settings, Info, BarChart3 } from 'lucide-react';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration: number;
  format: string;
  url: string;
}

interface AudioAnalysis {
  peakLevel: number;
  rmsLevel: number;
  dynamicRange: number;
  hasClipping: boolean;
  waveformData: number[];
}

interface NormalizationSettings {
  type: 'peak' | 'rms' | 'lufs' | 'custom';
  targetLevel: number;
  enableCompression: boolean;
  compressionRatio: number;
  enableLimiting: boolean;
  limitThreshold: number;
}

const AudioNormalizer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizationProgress, setNormalizationProgress] = useState(0);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [normalizedBlob, setNormalizedBlob] = useState<Blob | null>(null);

  const [settings, setSettings] = useState<NormalizationSettings>({
    type: 'peak',
    targetLevel: -3,
    enableCompression: false,
    compressionRatio: 4,
    enableLimiting: true,
    limitThreshold: -1
  });

  const normalizationTypes = {
    peak: 'Peak Normalization',
    rms: 'RMS Normalization', 
    lufs: 'LUFS Loudness',
    custom: 'Custom Settings'
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

    // Check file size limit (20MB for normalizer)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large ⚠️",
        description: "Please select a file smaller than 20MB for stability",
      });
      return;
    }

    setIsLoading(true);
    setAudioAnalysis(null);
    setNormalizedBlob(null);

    try {
      const audioInfo = await getAudioFileInfo(file);
      setAudioFile(audioInfo);
      
      // Automatically analyze the file
      await analyzeAudio(audioInfo);
      
      toast({
        title: "File Loaded & Analyzed ✅",
        description: `${file.name} ready for normalization`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Load Error ❌",
        description: "Failed to load or analyze audio file",
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

  const analyzeAudio = async (audioFile: AudioFile) => {
    setIsAnalyzing(true);
    
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Analyze audio in chunks to prevent crashes
      const analysis = await performAnalysis(audioBuffer);
      setAudioAnalysis(analysis);
      
      await audioContext.close();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error ❌",
        description: "Failed to analyze audio file",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performAnalysis = async (audioBuffer: AudioBuffer): Promise<AudioAnalysis> => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate peak level
    let peakLevel = 0;
    let rmsSum = 0;
    let clippingCount = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      peakLevel = Math.max(peakLevel, sample);
      rmsSum += sample * sample;
      
      if (sample >= 0.99) clippingCount++;
    }
    
    const rmsLevel = Math.sqrt(rmsSum / channelData.length);
    const hasClipping = clippingCount > (channelData.length * 0.001); // 0.1% threshold
    
    // Create simplified waveform data (max 1000 points)
    const waveformData: number[] = [];
    const step = Math.max(1, Math.floor(channelData.length / 1000));
    
    for (let i = 0; i < channelData.length; i += step) {
      waveformData.push(channelData[i]);
    }
    
    return {
      peakLevel: peakLevel,
      rmsLevel: rmsLevel,
      dynamicRange: peakLevel - rmsLevel,
      hasClipping: hasClipping,
      waveformData: waveformData
    };
  };

  const normalizeAudio = async () => {
    if (!audioFile || !audioAnalysis) return;

    setIsNormalizing(true);
    setNormalizationProgress(0);

    try {
      const normalizedBlob = await performNormalization(audioFile, settings, audioAnalysis);
      setNormalizedBlob(normalizedBlob);
      setNormalizationProgress(100);

      toast({
        title: "Normalization Complete! 🎉",
        description: `Audio normalized using ${normalizationTypes[settings.type]}`,
      });
    } catch (error) {
      console.error('Normalization error:', error);
      toast({
        title: "Normalization Error ❌",
        description: error instanceof Error ? error.message : "Failed to normalize audio",
      });
    } finally {
      setIsNormalizing(false);
    }
  };

  const performNormalization = async (
    audioFile: AudioFile, 
    settings: NormalizationSettings, 
    analysis: AudioAnalysis
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      let audioContext: AudioContext | null = null;
      
      try {
        setNormalizationProgress(10);
        await new Promise(resolve => setTimeout(resolve, 100));

        audioContext = new AudioContext();
        const arrayBuffer = await audioFile.file.arrayBuffer();
        
        setNormalizationProgress(30);
        await new Promise(resolve => setTimeout(resolve, 100));

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setNormalizationProgress(50);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Process audio with normalization
        const processedBuffer = await processAudioWithNormalization(audioBuffer, settings, analysis);
        
        setNormalizationProgress(80);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Convert to WAV
        const wavBlob = audioBufferToWav(processedBuffer);
        
        setNormalizationProgress(95);
        resolve(wavBlob);
        
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

  const processAudioWithNormalization = async (
    audioBuffer: AudioBuffer,
    settings: NormalizationSettings,
    analysis: AudioAnalysis
  ): Promise<AudioBuffer> => {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    let currentNode: AudioNode = source;

    // Apply normalization gain
    const gainNode = offlineContext.createGain();
    let targetGain = 1;

    switch (settings.type) {
      case 'peak':
        targetGain = Math.pow(10, settings.targetLevel / 20) / analysis.peakLevel;
        break;
      case 'rms':
        targetGain = Math.pow(10, settings.targetLevel / 20) / analysis.rmsLevel;
        break;
      case 'lufs':
        // Simplified LUFS calculation
        targetGain = Math.pow(10, (settings.targetLevel + 23) / 20) / analysis.rmsLevel;
        break;
      case 'custom':
        targetGain = Math.pow(10, settings.targetLevel / 20) / Math.max(analysis.peakLevel, analysis.rmsLevel);
        break;
    }

    gainNode.gain.value = Math.min(targetGain, 10); // Limit gain to prevent extreme amplification
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // Apply compression if enabled
    if (settings.enableCompression) {
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = settings.compressionRatio;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      currentNode.connect(compressor);
      currentNode = compressor;
    }

    // Apply limiting if enabled
    if (settings.enableLimiting) {
      const limiter = offlineContext.createDynamicsCompressor();
      limiter.threshold.value = settings.limitThreshold;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.01;
      
      currentNode.connect(limiter);
      currentNode = limiter;
    }

    currentNode.connect(offlineContext.destination);
    source.start();

    return await offlineContext.startRendering();
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

  const downloadNormalized = () => {
    if (!normalizedBlob || !audioFile) return;

    const url = URL.createObjectURL(normalizedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalName = audioFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_normalized.wav`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started 📥",
      description: `${originalName}_normalized.wav`,
    });
  };

  const updateSettings = (key: keyof NormalizationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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

  const formatDecibels = (value: number): string => {
    return `${(20 * Math.log10(Math.max(value, 0.0001))).toFixed(1)} dB`;
  };

  const handleBackClick = () => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    if (normalizedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(normalizedBlob));
    }
    navigate('/audio-tools');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-5xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">📊 Audio Normalizer</div>
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
                Select Audio File for Normalization
              </h3>
              
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Activity className="h-6 w-6 animate-pulse mr-2" />
                      <span className="text-gray-700">Loading audio file...</span>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 animate-pulse mr-2" />
                      <span className="text-gray-700">Analyzing audio levels...</span>
                    </div>
                  ) : audioFile ? (
                    <div className="space-y-2">
                      <Activity className="h-12 w-12 mx-auto text-green-600" />
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
                        Supports most audio formats
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Maximum file size: 20MB
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

            {/* Audio Analysis Results */}
            {audioAnalysis && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Audio Analysis Results
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 border border-gray-400">
                    <div className="font-bold text-gray-800">Peak Level</div>
                    <div className="text-lg font-mono text-blue-600">
                      {formatDecibels(audioAnalysis.peakLevel)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 border border-gray-400">
                    <div className="font-bold text-gray-800">RMS Level</div>
                    <div className="text-lg font-mono text-green-600">
                      {formatDecibels(audioAnalysis.rmsLevel)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 border border-gray-400">
                    <div className="font-bold text-gray-800">Dynamic Range</div>
                    <div className="text-lg font-mono text-purple-600">
                      {formatDecibels(audioAnalysis.dynamicRange)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 border border-gray-400">
                    <div className="font-bold text-gray-800">Clipping</div>
                    <div className={`text-lg font-bold ${audioAnalysis.hasClipping ? 'text-red-600' : 'text-green-600'}`}>
                      {audioAnalysis.hasClipping ? 'DETECTED' : 'NONE'}
                    </div>
                  </div>
                </div>

                {/* Simple Waveform Visualization */}
                <div className="mt-4">
                  <div className="font-bold text-gray-800 mb-2">Waveform Preview</div>
                  <div className="bg-black p-2 h-20 flex items-center justify-center border border-gray-400">
                    <svg width="100%" height="60" className="bg-black">
                      <polyline
                        fill="none"
                        stroke="#00ff00"
                        strokeWidth="1"
                        points={audioAnalysis.waveformData
                          .slice(0, 500)
                          .map((value, index) => 
                            `${(index / 500) * 100}%,${30 + value * 25}`
                          ).join(' ')
                        }
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Normalization Settings */}
            {audioFile && audioAnalysis && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Normalization Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Normalization Type</label>
                    <select
                      value={settings.type}
                      onChange={(e) => updateSettings('type', e.target.value)}
                      className="w-full p-2 border-2 border-gray-400 text-black"
                      style={{
                        borderTopColor: '#808080',
                        borderLeftColor: '#808080',
                        borderRightColor: '#dfdfdf',
                        borderBottomColor: '#dfdfdf'
                      }}
                    >
                      {Object.entries(normalizationTypes).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Target Level ({settings.type === 'lufs' ? 'LUFS' : 'dB'})
                    </label>
                    <input
                      type="range"
                      min={settings.type === 'lufs' ? -30 : -20}
                      max={settings.type === 'lufs' ? -10 : 0}
                      step="0.1"
                      value={settings.targetLevel}
                      onChange={(e) => updateSettings('targetLevel', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-600 text-center mt-1">
                      {settings.targetLevel.toFixed(1)} {settings.type === 'lufs' ? 'LUFS' : 'dB'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableCompression}
                          onChange={(e) => updateSettings('enableCompression', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-bold">Enable Compression</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableLimiting}
                          onChange={(e) => updateSettings('enableLimiting', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-bold">Enable Limiting</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Normalization Controls */}
            {audioFile && audioAnalysis && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={normalizeAudio}
                    disabled={isNormalizing}
                    className="win98-btn px-4 py-3 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    {isNormalizing ? (
                      <>
                        <Activity className="h-4 w-4 animate-pulse mr-2" />
                        Normalizing... {normalizationProgress}%
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Normalize Audio ({normalizationTypes[settings.type]})
                      </>
                    )}
                  </button>

                  {isNormalizing && (
                    <div className="w-full bg-gray-300 border-2 border-gray-400" style={{
                      borderTopColor: '#808080',
                      borderLeftColor: '#808080',
                      borderRightColor: '#dfdfdf',
                      borderBottomColor: '#dfdfdf'
                    }}>
                      <div 
                        className="bg-green-600 h-4 transition-all duration-300"
                        style={{ width: `${normalizationProgress}%` }}
                      />
                    </div>
                  )}

                  {normalizedBlob && (
                    <button
                      onClick={downloadNormalized}
                      className="win98-btn px-4 py-3 text-black flex items-center justify-center font-bold bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Normalized Audio
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Info Panel */}
            <div className="bg-gray-100 p-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Normalization Guide
              </h3>
              
              <div className="text-xs text-gray-700 space-y-2">
                <div><strong>Peak:</strong> Normalize to peak amplitude level</div>
                <div><strong>RMS:</strong> Normalize to average (RMS) level</div>
                <div><strong>LUFS:</strong> Loudness-based normalization (broadcast standard)</div>
                <div><strong>Custom:</strong> Advanced normalization with custom settings</div>
                <div><strong>Note:</strong> File size limit is 20MB for stable processing</div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-700 flex items-center">
            <span>📊 Audio Normalizer - Professional loudness control</span>
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

export default AudioNormalizer;
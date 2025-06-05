import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, RefreshCw, Volume2, Activity, BarChart3, Sliders } from 'lucide-react';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration: number;
  url: string;
  buffer?: AudioBuffer;
}

interface AudioAnalysis {
  peakLevel: number;
  rmsLevel: number;
  loudness: number;
  dynamicRange: number;
  clippingCount: number;
}

interface NormalizationSettings {
  type: 'peak' | 'rms' | 'loudness' | 'custom';
  targetLevel: number;
  enableLimiter: boolean;
  limiterThreshold: number;
  enableCompression: boolean;
  compressionRatio: number;
  compressionThreshold: number;
  makeupGain: number;
}

const AudioNormalizer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [settings, setSettings] = useState<NormalizationSettings>({
    type: 'peak',
    targetLevel: -1, // dB
    enableLimiter: true,
    limiterThreshold: -0.5,
    enableCompression: false,
    compressionRatio: 4,
    compressionThreshold: -12,
    makeupGain: 0
  });

  const normalizationTypes = {
    peak: 'Peak Normalization - Adjust highest peak to target level',
    rms: 'RMS Normalization - Adjust average loudness level',
    loudness: 'Loudness Normalization - LUFS/EBU R128 standard',
    custom: 'Custom Processing - Full control over all parameters'
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
    setProcessedBlob(null);
    setAnalysis(null);

    try {
      const audioInfo = await loadAudioFile(file);
      setAudioFile(audioInfo);
      
      // Analyze the audio
      if (audioInfo.buffer) {
        const audioAnalysis = analyzeAudio(audioInfo.buffer);
        setAnalysis(audioAnalysis);
        drawWaveform(audioInfo.buffer);
      }
      
      toast({
        title: "File Loaded",
        description: `${file.name} loaded and analyzed`,
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

  const loadAudioFile = async (file: File): Promise<AudioFile> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const url = URL.createObjectURL(file);

      return {
        file,
        name: file.name,
        size: file.size,
        duration: audioBuffer.duration,
        url,
        buffer: audioBuffer
      };
    } finally {
      audioContext.close();
    }
  };

  const analyzeAudio = (audioBuffer: AudioBuffer): AudioAnalysis => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    let peak = 0;
    let sumSquares = 0;
    let clippingCount = 0;
    
    // Calculate peak, RMS, and clipping
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      peak = Math.max(peak, sample);
      sumSquares += sample * sample;
      
      if (sample >= 0.99) {
        clippingCount++;
      }
    }
    
    const rms = Math.sqrt(sumSquares / channelData.length);
    const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
    
    // Simplified loudness calculation (approximation of LUFS)
    const loudness = rmsDb - 23; // Rough LUFS approximation
    
    // Dynamic range (difference between peak and RMS)
    const dynamicRange = peakDb - rmsDb;

    return {
      peakLevel: peakDb,
      rmsLevel: rmsDb,
      loudness: loudness,
      dynamicRange: dynamicRange,
      clippingCount: clippingCount
    };
  };

  const drawWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = startSample + samplesPerPixel;
      
      let min = 1;
      let max = -1;
      
      for (let i = startSample; i < endSample && i < channelData.length; i++) {
        const sample = channelData[i];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
      }
      
      const yMin = ((min + 1) / 2) * height;
      const yMax = ((max + 1) / 2) * height;
      
      if (x === 0) {
        ctx.moveTo(x, height / 2);
      }
      
      ctx.lineTo(x, yMax);
      ctx.lineTo(x, yMin);
    }
    
    ctx.stroke();
  };

  const normalizeAudio = async () => {
    if (!audioFile?.buffer) return;

    setIsProcessing(true);
    setProcessProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProcessProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const normalizedBuffer = await processAudio(audioFile.buffer, settings);
      const normalizedBlob = audioBufferToWav(normalizedBuffer);
      
      clearInterval(progressInterval);
      setProcessProgress(100);
      setProcessedBlob(normalizedBlob);

      // Re-analyze the processed audio
      const newAnalysis = analyzeAudio(normalizedBuffer);
      setAnalysis(newAnalysis);

      toast({
        title: "Normalization Complete",
        description: `Audio normalized using ${settings.type} method`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to normalize audio",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioBuffer: AudioBuffer, settings: NormalizationSettings): Promise<AudioBuffer> => {
    const audioContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    let currentNode: AudioNode = source;

    // Apply compression if enabled
    if (settings.enableCompression) {
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = settings.compressionThreshold;
      compressor.ratio.value = settings.compressionRatio;
      compressor.attack.value = 0.003; // 3ms
      compressor.release.value = 0.25; // 250ms
      
      currentNode.connect(compressor);
      currentNode = compressor;
    }

    // Calculate gain based on normalization type
    let gain = 1;
    const currentAnalysis = analyzeAudio(audioBuffer);
    
    switch (settings.type) {
      case 'peak':
        if (currentAnalysis.peakLevel > -Infinity) {
          gain = Math.pow(10, (settings.targetLevel - currentAnalysis.peakLevel) / 20);
        }
        break;
      case 'rms':
        if (currentAnalysis.rmsLevel > -Infinity) {
          gain = Math.pow(10, (settings.targetLevel - currentAnalysis.rmsLevel) / 20);
        }
        break;
      case 'loudness':
        if (currentAnalysis.loudness > -Infinity) {
          gain = Math.pow(10, (settings.targetLevel - currentAnalysis.loudness) / 20);
        }
        break;
      case 'custom':
        gain = Math.pow(10, settings.makeupGain / 20);
        break;
    }

    // Apply gain
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // Apply limiter if enabled
    if (settings.enableLimiter) {
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = settings.limiterThreshold;
      limiter.ratio.value = 20; // Heavy limiting
      limiter.attack.value = 0.001; // 1ms
      limiter.release.value = 0.01; // 10ms
      
      currentNode.connect(limiter);
      currentNode = limiter;
    }

    currentNode.connect(audioContext.destination);
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

  const downloadProcessed = () => {
    if (!processedBlob || !audioFile) return;

    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalName = audioFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_normalized.wav`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `${originalName}_normalized.wav`,
    });
  };

  const updateSettings = (key: keyof NormalizationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatDb = (db: number): string => {
    if (db === -Infinity) return '-∞ dB';
    return `${db.toFixed(1)} dB`;
  };

  const handleBackClick = () => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    navigate('/audio-tools');
  };

  return (
    <div className="min-h-screen bg-win98-bg overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Title Bar */}
        <div className="win98-title-bar flex items-center justify-between px-2 py-1">
          <div className="flex items-center">
            <Volume2 className="h-4 w-4 mr-2" />
            <span className="font-bold">Audio Normalizer - Professional Loudness Control</span>
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
                    <Volume2 className="h-12 w-12 mx-auto text-blue-500" />
                    <div className="text-black font-medium">{audioFile.name}</div>
                    <div className="text-sm text-gray-600">
                      Duration: {Math.floor(audioFile.duration / 60)}:{Math.floor(audioFile.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <div className="text-gray-600 mb-2">Drop audio file here or click to browse</div>
                    <div className="text-xs text-gray-500">Supports all major audio formats</div>
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

          {/* Waveform Visualization */}
          {audioFile && (
            <div className="bg-white p-4 mb-4 win98-panel">
              <h3 className="text-sm font-medium text-black mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Waveform
              </h3>
              <canvas
                ref={canvasRef}
                width="600"
                height="150"
                className="w-full h-32 border border-gray-300 rounded bg-black"
              />
            </div>
          )}

          {/* Audio Analysis */}
          {analysis && (
            <div className="bg-white p-4 mb-4 win98-panel">
              <h3 className="text-sm font-medium text-black mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Audio Analysis
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-600">Peak Level</div>
                  <div className={`font-mono ${analysis.peakLevel > -1 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatDb(analysis.peakLevel)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">RMS Level</div>
                  <div className="font-mono text-blue-600">
                    {formatDb(analysis.rmsLevel)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Loudness</div>
                  <div className="font-mono text-purple-600">
                    {formatDb(analysis.loudness)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Dynamic Range</div>
                  <div className="font-mono text-gray-700">
                    {formatDb(analysis.dynamicRange)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Clipping</div>
                  <div className={`font-mono ${analysis.clippingCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analysis.clippingCount} samples
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Normalization Settings */}
          {audioFile && (
            <div className="bg-white p-4 mb-4 win98-panel">
              <h3 className="text-sm font-medium text-black mb-3 flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                Normalization Settings
              </h3>

              <div className="space-y-4">
                {/* Normalization Type */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Normalization Type</label>
                  <select
                    value={settings.type}
                    onChange={(e) => updateSettings('type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    {Object.entries(normalizationTypes).map(([key, description]) => (
                      <option key={key} value={key}>
                        {key.toUpperCase()} - {description.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {normalizationTypes[settings.type]}
                  </div>
                </div>

                {/* Target Level */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Target Level: {settings.targetLevel} dB
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="0"
                    step="0.1"
                    value={settings.targetLevel}
                    onChange={(e) => updateSettings('targetLevel', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Advanced Settings Toggle */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="win98-btn px-3 py-1 text-xs"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                  </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {/* Limiter */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="limiter"
                        checked={settings.enableLimiter}
                        onChange={(e) => updateSettings('enableLimiter', e.target.checked)}
                      />
                      <label htmlFor="limiter" className="text-xs text-gray-600">
                        Enable Limiter
                      </label>
                      {settings.enableLimiter && (
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500">
                            Threshold: {settings.limiterThreshold} dB
                          </label>
                          <input
                            type="range"
                            min="-3"
                            max="0"
                            step="0.1"
                            value={settings.limiterThreshold}
                            onChange={(e) => updateSettings('limiterThreshold', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Compression */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="compression"
                        checked={settings.enableCompression}
                        onChange={(e) => updateSettings('enableCompression', e.target.checked)}
                      />
                      <label htmlFor="compression" className="text-xs text-gray-600">
                        Enable Compression
                      </label>
                    </div>

                    {settings.enableCompression && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Ratio: {settings.compressionRatio}:1
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            value={settings.compressionRatio}
                            onChange={(e) => updateSettings('compressionRatio', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Threshold: {settings.compressionThreshold} dB
                          </label>
                          <input
                            type="range"
                            min="-30"
                            max="0"
                            step="1"
                            value={settings.compressionThreshold}
                            onChange={(e) => updateSettings('compressionThreshold', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Makeup Gain (for custom mode) */}
                    {settings.type === 'custom' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          Makeup Gain: {settings.makeupGain} dB
                        </label>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="0.1"
                          value={settings.makeupGain}
                          onChange={(e) => updateSettings('makeupGain', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Controls */}
          {audioFile && (
            <div className="bg-white p-4 mb-4 win98-panel">
              <div className="flex flex-col gap-4">
                <button
                  onClick={normalizeAudio}
                  disabled={isProcessing}
                  className="win98-btn px-4 py-2 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Processing... {processProgress}%
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Normalize Audio
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="w-full bg-gray-200 rounded">
                    <div 
                      className="bg-blue-500 rounded h-2 transition-all duration-300"
                      style={{ width: `${processProgress}%` }}
                    />
                  </div>
                )}

                {/* Download Button */}
                {processedBlob && (
                  <button
                    onClick={downloadProcessed}
                    className="win98-btn px-4 py-2 text-black flex items-center justify-center bg-green-50 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Normalized Audio
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioNormalizer;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Play, Pause, Volume2, VolumeX, BarChart3, Activity, Settings, Eye } from 'lucide-react';

type VisualizationType = 'bars' | 'waveform' | 'circular' | 'waterfall' | 'oscilloscope' | 'spectrum3d';

interface VisualizerSettings {
  type: VisualizationType;
  fftSize: number;
  smoothing: number;
  sensitivity: number;
  colorScheme: 'rainbow' | 'fire' | 'ocean' | 'neon' | 'vintage';
  barCount: number;
  showPeaks: boolean;
  showFreqLabels: boolean;
}

interface AudioFile {
  file: File;
  name: string;
  url: string;
}

const AudioVisualizer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const sourceRef = useRef<MediaElementAudioSourceNode>();
  const animationRef = useRef<number>();

  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUsingMicrophone, setIsUsingMicrophone] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const [settings, setSettings] = useState<VisualizerSettings>({
    type: 'bars',
    fftSize: 256,
    smoothing: 0.8,
    sensitivity: 1,
    colorScheme: 'rainbow',
    barCount: 64,
    showPeaks: true,
    showFreqLabels: false
  });

  // Waterfall history for spectogram effect
  const [waterfallHistory, setWaterfallHistory] = useState<number[][]>([]);

  const visualizationTypes = {
    bars: 'Frequency Bars - Classic spectrum analyzer',
    waveform: 'Waveform - Time domain visualization',
    circular: 'Circular Spectrum - Radial frequency display',
    waterfall: 'Waterfall - Frequency vs Time spectrogram',
    oscilloscope: 'Oscilloscope - Real-time waveform',
    spectrum3d: '3D Spectrum - Perspective frequency bars'
  };

  const colorSchemes = {
    rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'],
    fire: ['#000000', '#400000', '#800000', '#ff0000', '#ff4000', '#ff8000', '#ffff00', '#ffffff'],
    ocean: ['#000040', '#000080', '#0000ff', '#0040ff', '#0080ff', '#00ffff', '#40ffff', '#80ffff'],
    neon: ['#ff00ff', '#ff0080', '#ff0040', '#ff4000', '#ff8000', '#ffff00', '#80ff00', '#00ff80'],
    vintage: ['#2a1810', '#4a2c17', '#6b3e07', '#8b5a00', '#ab7500', '#cb9500', '#ebab00', '#ffc000']
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [micStream]);

  const initializeAudioContext = async () => {
    if (audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = settings.fftSize;
      analyser.smoothingTimeConstant = settings.smoothing;
      analyserRef.current = analyser;

      if (audioRef.current && !sourceRef.current) {
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        sourceRef.current = source;
      }
    } catch (error) {
      console.error('Error initializing Web Audio API:', error);
      toast({
        title: "Audio Error",
        description: "Failed to initialize audio context",
      });
    }
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

    const url = URL.createObjectURL(file);
    setAudioFile({
      file,
      name: file.name,
      url
    });

    if (audioRef.current) {
      audioRef.current.src = url;
    }

    await initializeAudioContext();

    toast({
      title: "File Loaded",
      description: `${file.name} ready for visualization`,
    });
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
      startVisualization();
    }
  };

  const toggleMicrophone = async () => {
    if (isUsingMicrophone) {
      // Stop microphone
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        setMicStream(null);
      }
      setIsUsingMicrophone(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      // Start microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);

        await initializeAudioContext();
        if (audioContextRef.current && analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
        }

        setIsUsingMicrophone(true);
        startVisualization();

        toast({
          title: "Microphone Active",
          description: "Visualizing microphone input",
        });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Error",
          description: "Failed to access microphone",
        });
      }
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      if (settings.type === 'waveform' || settings.type === 'oscilloscope') {
        analyserRef.current.getByteTimeDomainData(dataArray);
      } else {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      switch (settings.type) {
        case 'bars':
          drawFrequencyBars(ctx, canvas, dataArray);
          break;
        case 'waveform':
          drawWaveform(ctx, canvas, dataArray);
          break;
        case 'circular':
          drawCircularSpectrum(ctx, canvas, dataArray);
          break;
        case 'waterfall':
          drawWaterfall(ctx, canvas, dataArray);
          break;
        case 'oscilloscope':
          drawOscilloscope(ctx, canvas, dataArray);
          break;
        case 'spectrum3d':
          drawSpectrum3D(ctx, canvas, dataArray);
          break;
      }

      if (isPlaying || isUsingMicrophone) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    render();
  };

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / settings.barCount;
    const colors = colorSchemes[settings.colorScheme];
    
    for (let i = 0; i < settings.barCount; i++) {
      const dataIndex = Math.floor(i * dataArray.length / settings.barCount);
      const barHeight = (dataArray[dataIndex] / 255) * height * settings.sensitivity;

      const colorIndex = Math.floor((i / settings.barCount) * colors.length);
      ctx.fillStyle = colors[colorIndex] || colors[0];

      const x = i * barWidth;
      const y = height - barHeight;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);

      // Draw peaks if enabled
      if (settings.showPeaks) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y - 2, barWidth - 1, 2);
      }
    }

    // Draw frequency labels if enabled
    if (settings.showFreqLabels) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const nyquist = sampleRate / 2;
      
      for (let i = 0; i < 5; i++) {
        const freq = (i / 4) * nyquist;
        const x = (i / 4) * width;
        ctx.fillText(`${(freq / 1000).toFixed(1)}k`, x, height - 5);
      }
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = colorSchemes[settings.colorScheme][4];
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] / 128.0) * settings.sensitivity;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawCircularSpectrum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const colors = colorSchemes[settings.colorScheme];
    const angleStep = (Math.PI * 2) / settings.barCount;

    for (let i = 0; i < settings.barCount; i++) {
      const dataIndex = Math.floor(i * dataArray.length / settings.barCount);
      const magnitude = (dataArray[dataIndex] / 255) * settings.sensitivity;
      const angle = i * angleStep;

      const colorIndex = Math.floor((i / settings.barCount) * colors.length);
      ctx.strokeStyle = colors[colorIndex] || colors[0];
      ctx.lineWidth = 3;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + magnitude * 100);
      const y2 = centerY + Math.sin(angle) * (radius + magnitude * 100);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawWaterfall = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;

    // Add current frame to history
    const currentFrame = Array.from(dataArray).slice(0, settings.barCount);
    setWaterfallHistory(prev => {
      const newHistory = [currentFrame, ...prev].slice(0, height);
      return newHistory;
    });

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / settings.barCount;
    const colors = colorSchemes[settings.colorScheme];

    waterfallHistory.forEach((frame, frameIndex) => {
      const y = frameIndex;
      frame.forEach((value, barIndex) => {
        const intensity = (value / 255) * settings.sensitivity;
        const colorIndex = Math.floor(intensity * (colors.length - 1));
        ctx.fillStyle = colors[colorIndex] || colors[0];
        
        const x = barIndex * barWidth;
        ctx.fillRect(x, y, barWidth, 1);
      });
    });
  };

  const drawOscilloscope = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = colorSchemes[settings.colorScheme][6];
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = ((dataArray[i] - 128) / 128.0) * settings.sensitivity;
      const y = (height / 2) + (v * height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawSpectrum3D = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const colors = colorSchemes[settings.colorScheme];
    const perspective = 0.7;
    const barWidth = width / settings.barCount;

    for (let i = 0; i < settings.barCount; i++) {
      const dataIndex = Math.floor(i * dataArray.length / settings.barCount);
      const barHeight = (dataArray[dataIndex] / 255) * height * settings.sensitivity;

      const colorIndex = Math.floor((i / settings.barCount) * colors.length);
      const color = colors[colorIndex] || colors[0];

      // 3D effect
      const depth = (i / settings.barCount) * 50;
      const x = i * barWidth + depth * perspective;
      const y = height - barHeight + depth * perspective * 0.5;
      const w = barWidth * (1 - depth / width);
      const h = barHeight * (1 - depth / (height * 2));

      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      // Add highlight for 3D effect
      ctx.fillStyle = `${color}88`;
      ctx.fillRect(x + w, y, depth * perspective, h);
      ctx.fillRect(x, y - depth * perspective * 0.5, w, depth * perspective * 0.5);
    }
  };

  const updateSettings = (key: keyof VisualizerSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Update analyser settings if they exist
      if (analyserRef.current) {
        if (key === 'fftSize') {
          analyserRef.current.fftSize = value;
        } else if (key === 'smoothing') {
          analyserRef.current.smoothingTimeConstant = value;
        }
      }
      
      return newSettings;
    });
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
    }
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    navigate('/audio-tools');
  };

  // Start visualization when settings change
  useEffect(() => {
    if ((isPlaying || isUsingMicrophone) && analyserRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startVisualization();
    }
  }, [settings.type, settings.barCount, settings.sensitivity, settings.colorScheme]);

  return (
    <div className="min-h-screen bg-win98-bg overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Title Bar */}
        <div className="win98-title-bar flex items-center justify-between px-2 py-1">
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="font-bold">Audio Visualizer - Real-time Spectrum Analysis</span>
          </div>
          <button
            onClick={handleBackClick}
            className="win98-btn-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {/* Visualization Canvas */}
          <div className="bg-white p-4 mb-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Audio Visualization - {visualizationTypes[settings.type]}
            </h3>
            
            <canvas
              ref={canvasRef}
              width="800"
              height="400"
              className="w-full h-64 border border-gray-300 rounded bg-black"
            />
          </div>

          {/* Audio Source Controls */}
          <div className="bg-white p-4 mb-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center">
              <Volume2 className="h-4 w-4 mr-2" />
              Audio Source
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* File Upload */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="win98-btn px-3 py-2"
                >
                  Load Audio File
                </button>
                
                <button
                  onClick={toggleMicrophone}
                  className={`win98-btn px-3 py-2 ${isUsingMicrophone ? 'shadow-win98-in' : ''}`}
                >
                  {isUsingMicrophone ? 'Stop Microphone' : 'Use Microphone'}
                </button>

                {audioFile && (
                  <span className="text-sm text-gray-600">{audioFile.name}</span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Audio Controls */}
              {audioFile && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlayPause} className="win98-btn p-2">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-gray-600 w-10">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 w-10">{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className="win98-btn p-1">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 w-8">{volume}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visualization Settings */}
          <div className="bg-white p-4 mb-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Visualization Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visualization Type */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Visualization Type</label>
                <select
                  value={settings.type}
                  onChange={(e) => updateSettings('type', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                >
                  {Object.entries(visualizationTypes).map(([key, description]) => (
                    <option key={key} value={key}>
                      {description.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Color Scheme</label>
                <select
                  value={settings.colorScheme}
                  onChange={(e) => updateSettings('colorScheme', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                >
                  {Object.keys(colorSchemes).map(scheme => (
                    <option key={scheme} value={scheme}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* FFT Size */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  FFT Size: {settings.fftSize}
                </label>
                <select
                  value={settings.fftSize}
                  onChange={(e) => updateSettings('fftSize', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                >
                  <option value={128}>128</option>
                  <option value={256}>256</option>
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                  <option value={2048}>2048</option>
                </select>
              </div>

              {/* Bar Count */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Bar Count: {settings.barCount}
                </label>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="8"
                  value={settings.barCount}
                  onChange={(e) => updateSettings('barCount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Smoothing */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Smoothing: {settings.smoothing.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.smoothing}
                  onChange={(e) => updateSettings('smoothing', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Sensitivity */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Sensitivity: {settings.sensitivity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => updateSettings('sensitivity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Additional Options */}
              <div className="md:col-span-2 flex gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={settings.showPeaks}
                    onChange={(e) => updateSettings('showPeaks', e.target.checked)}
                  />
                  Show Peaks
                </label>
                
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={settings.showFreqLabels}
                    onChange={(e) => updateSettings('showFreqLabels', e.target.checked)}
                  />
                  Show Frequency Labels
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white p-4 win98-panel">
            <h3 className="text-sm font-medium text-black mb-3">Instructions</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Load an audio file or use your microphone as input</div>
              <div>• Choose from different visualization types: bars, waveform, circular, waterfall, oscilloscope, 3D</div>
              <div>• Adjust FFT size for frequency resolution (higher = more detail)</div>
              <div>• Use smoothing to reduce flickering</div>
              <div>• Increase sensitivity to amplify visualization amplitude</div>
              <div>• Try different color schemes for various visual effects</div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          preload="metadata"
        />
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioVisualizer;

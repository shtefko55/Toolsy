import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Volume2, VolumeX, Download, Timer } from 'lucide-react';

type NoiseType = 'white' | 'pink' | 'brown' | 'blue' | 'violet';

const WhiteNoiseGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext>();
  const noiseNodeRef = useRef<AudioBufferSourceNode>();
  const gainNodeRef = useRef<GainNode>();
  const filterNodeRef = useRef<BiquadFilterNode>();
  const timerRef = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [noiseType, setNoiseType] = useState<NoiseType>('white');
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer settings
  const [useTimer, setUseTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Filter settings for different noise colors
  const [filterFrequency, setFilterFrequency] = useState(1000);
  const [filterQ, setFilterQ] = useState(1);

  const noiseDescriptions = {
    white: 'Equal energy across all frequencies - sharp, consistent',
    pink: 'Lower frequencies emphasized - warmer, natural',
    brown: 'Heavy low-frequency bias - deep, rumbling',
    blue: 'Higher frequencies emphasized - bright, airy',
    violet: 'Very high frequencies - crisp, detailed'
  };

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNodeRef.current = gainNode;
        filterNodeRef.current = filterNode;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      } catch (error) {
        console.error('Error initializing Web Audio API:', error);
      }
    };

    initAudio();

    return () => {
      stopNoise();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Generate noise buffer based on type
  const generateNoiseBuffer = (type: NoiseType, duration: number = 2): AudioBuffer => {
    if (!audioContextRef.current) throw new Error('Audio context not initialized');

    const audioContext = audioContextRef.current;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
      case 'white':
        // Pure white noise - random values
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        break;

      case 'pink':
        // Pink noise - 1/f noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        break;

      case 'brown':
        // Brown noise - integrated white noise
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] *= 3.5; // Amplify brown noise
        }
        break;

      case 'blue':
        // Blue noise - differentiated white noise
        let lastWhite = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = white - lastWhite;
          lastWhite = white;
          data[i] *= 0.5;
        }
        break;

      case 'violet':
        // Violet noise - double differentiated
        let lastWhite2 = 0, lastBlue = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          const blue = white - lastWhite2;
          data[i] = blue - lastBlue;
          lastWhite2 = white;
          lastBlue = blue;
          data[i] *= 0.3;
        }
        break;
    }

    return buffer;
  };

  const startNoise = () => {
    if (!audioContextRef.current || !gainNodeRef.current || !filterNodeRef.current) return;

    stopNoise(); // Stop any existing noise

    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    try {
      const buffer = generateNoiseBuffer(noiseType);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // Apply filtering based on noise type
      filterNodeRef.current.type = 'lowpass';
      filterNodeRef.current.frequency.setValueAtTime(filterFrequency, audioContext.currentTime);
      filterNodeRef.current.Q.setValueAtTime(filterQ, audioContext.currentTime);
      
      source.connect(filterNodeRef.current);
      noiseNodeRef.current = source;

      const currentVolume = isMuted ? 0 : (volume / 100);
      gainNodeRef.current.gain.setValueAtTime(currentVolume, audioContext.currentTime);

      source.start();
      setIsPlaying(true);

      // Start timer if enabled
      if (useTimer) {
        setTimeRemaining(timerMinutes * 60);
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              stopNoise();
              toast({
                title: "Timer Finished",
                description: "Noise generator stopped automatically.",
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      toast({
        title: "Noise Started",
        description: `Playing ${noiseType} noise${useTimer ? ` for ${timerMinutes} minutes` : ''}`,
      });
    } catch (error) {
      console.error('Error starting noise:', error);
      toast({
        title: "Error",
        description: "Failed to start noise generator.",
      });
    }
  };

  const stopNoise = () => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = undefined;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    setIsPlaying(false);
    setTimeRemaining(0);
  };

  const toggleNoise = () => {
    if (isPlaying) {
      stopNoise();
    } else {
      startNoise();
    }
  };

  const updateVolume = (vol: number) => {
    setVolume(vol);
    if (gainNodeRef.current && audioContextRef.current && !isMuted) {
      gainNodeRef.current.gain.setValueAtTime(vol / 100, audioContextRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodeRef.current && audioContextRef.current) {
      const vol = isMuted ? (volume / 100) : 0;
      gainNodeRef.current.gain.setValueAtTime(vol, audioContextRef.current.currentTime);
    }
  };

  const exportNoise = async (duration: number) => {
    if (!audioContextRef.current) return;

    try {
      const offlineContext = new OfflineAudioContext(1, 48000 * duration, 48000);
      const buffer = generateNoiseBuffer(noiseType, duration);
      const source = offlineContext.createBufferSource();
      const gainNode = offlineContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      gainNode.gain.setValueAtTime(volume / 100, 0);

      source.start(0);
      
      const audioBuffer = await offlineContext.startRendering();
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noiseType}_noise_${duration}min.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Noise Exported",
        description: `Exported ${duration} minute ${noiseType} noise file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export noise file",
      });
    }
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

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < audioBuffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    stopNoise();
    navigate('/audio-tools');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button className="win98-btn px-2 py-0.5 h-6 text-xs" onClick={handleBackClick}>
                ← Back
              </button>
              <div className="font-ms-sans">📻 White Noise Generator</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-6">
            {/* Current Noise Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-black mb-2 capitalize">{noiseType} Noise</div>
              <div className="text-sm text-gray-600 max-w-md mx-auto">
                {noiseDescriptions[noiseType]}
              </div>
              {timeRemaining > 0 && (
                <div className="text-lg text-blue-600 mt-2">
                  ⏰ {formatTime(timeRemaining)} remaining
                </div>
              )}
            </div>

            {/* Play/Stop Button */}
            <div className="flex justify-center mb-6">
              <button
                className={`win98-btn p-4 ${isPlaying ? 'bg-red-100' : 'bg-green-100'}`}
                onClick={toggleNoise}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-red-600" />
                ) : (
                  <Play className="h-8 w-8 text-green-600" />
                )}
              </button>
            </div>

            {/* Noise Type Selection */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Noise Color</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {(['white', 'pink', 'brown', 'blue', 'violet'] as NoiseType[]).map((type) => (
                  <button
                    key={type}
                    className={`win98-btn p-3 text-center ${noiseType === type ? 'shadow-win98-in' : ''}`}
                    onClick={() => setNoiseType(type)}
                  >
                    <div className="text-sm font-medium capitalize">{type}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {type === 'white' && '🔊 Sharp'}
                      {type === 'pink' && '🌸 Natural'}
                      {type === 'brown' && '🤎 Deep'}
                      {type === 'blue' && '💙 Bright'}
                      {type === 'violet' && '💜 Crisp'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Volume Control</h3>
              <div className="flex items-center gap-3">
                <button className="win98-btn p-2" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => updateVolume(parseInt(e.target.value))}
                  disabled={isMuted}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                
                <span className="text-sm text-gray-600 w-10">{volume}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                💡 Start with lower volume (20-40%) for comfort
              </div>
            </div>

            {/* Timer Settings */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-black">Auto-Stop Timer</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="use-timer"
                    checked={useTimer}
                    onChange={(e) => setUseTimer(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="use-timer" className="text-xs text-gray-600">
                    Enable Timer
                  </label>
                </div>
              </div>
              
              {useTimer && (
                <div className="flex items-center gap-4">
                  <Timer className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Stop after:</span>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                    className="w-20 p-1 border border-gray-300 rounded text-black text-center"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Export Noise</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">Export duration:</span>
                {[5, 10, 30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    className="win98-btn px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => exportNoise(minutes)}
                  >
                    <Download className="h-3 w-3" />
                    {minutes} min
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Creates high-quality WAV files for offline use
              </div>
            </div>

            {/* Use Cases */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Common Use Cases</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <strong>Sleep & Relaxation:</strong>
                  <br />Pink or Brown noise at low volume
                </div>
                <div>
                  <strong>Focus & Concentration:</strong>
                  <br />White or Pink noise at medium volume
                </div>
                <div>
                  <strong>Masking Distractions:</strong>
                  <br />White or Blue noise to cover background sounds
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

export default WhiteNoiseGenerator; 
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

const ToneGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext>();
  const oscillatorRef = useRef<OscillatorNode>();
  const gainNodeRef = useRef<GainNode>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // A4 note
  const [waveType, setWaveType] = useState<WaveType>('sine');
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(2); // seconds for export
  
  // ADSR Envelope controls
  const [attack, setAttack] = useState(0.1);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.7);
  const [release, setRelease] = useState(0.3);
  const [useEnvelope, setUseEnvelope] = useState(false);

  // Musical note mapping
  const notes = {
    'C': [65.41, 130.81, 261.63, 523.25, 1046.50],
    'C#': [69.30, 138.59, 277.18, 554.37, 1108.73],
    'D': [73.42, 146.83, 293.66, 587.33, 1174.66],
    'D#': [77.78, 155.56, 311.13, 622.25, 1244.51],
    'E': [82.41, 164.81, 329.63, 659.25, 1318.51],
    'F': [87.31, 174.61, 349.23, 698.46, 1396.91],
    'F#': [92.50, 185.00, 369.99, 739.99, 1479.98],
    'G': [98.00, 196.00, 392.00, 783.99, 1567.98],
    'G#': [103.83, 207.65, 415.30, 830.61, 1661.22],
    'A': [110.00, 220.00, 440.00, 880.00, 1760.00],
    'A#': [116.54, 233.08, 466.16, 932.33, 1864.66],
    'B': [123.47, 246.94, 493.88, 987.77, 1975.53]
  };

  const octaveNames = ['2', '3', '4', '5', '6'];

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNodeRef.current = gainNode;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      } catch (error) {
        console.error('Error initializing Web Audio API:', error);
      }
    };

    initAudio();

    return () => {
      stopTone();
    };
  }, []);

  const startTone = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    stopTone(); // Stop any existing tone

    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    oscillatorRef.current = oscillator;

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNodeRef.current);

    const currentVolume = isMuted ? 0 : (volume / 100);

    if (useEnvelope) {
      // ADSR Envelope
      const now = audioContext.currentTime;
      gainNodeRef.current.gain.setValueAtTime(0, now);
      gainNodeRef.current.gain.linearRampToValueAtTime(currentVolume, now + attack);
      gainNodeRef.current.gain.linearRampToValueAtTime(currentVolume * sustain, now + attack + decay);
    } else {
      // Immediate volume
      gainNodeRef.current.gain.setValueAtTime(currentVolume, audioContext.currentTime);
    }

    oscillator.start();
    setIsPlaying(true);

    toast({
      title: "Tone Started",
      description: `Playing ${frequency.toFixed(1)} Hz ${waveType} wave`,
    });
  };

  const stopTone = () => {
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      
      if (useEnvelope) {
        // Release envelope
        gainNodeRef.current.gain.cancelScheduledValues(now);
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
        gainNodeRef.current.gain.linearRampToValueAtTime(0, now + release);
        
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current = undefined;
          }
        }, release * 1000);
      } else {
        gainNodeRef.current.gain.setValueAtTime(0, now);
        oscillatorRef.current.stop();
        oscillatorRef.current = undefined;
      }
    }
    
    setIsPlaying(false);
  };

  const toggleTone = () => {
    if (isPlaying) {
      stopTone();
    } else {
      startTone();
    }
  };

  const updateFrequency = (freq: number) => {
    setFrequency(freq);
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
    }
  };

  const updateVolume = (vol: number) => {
    setVolume(vol);
    if (gainNodeRef.current && audioContextRef.current && !isMuted) {
      const currentVolume = vol / 100;
      gainNodeRef.current.gain.setValueAtTime(currentVolume, audioContextRef.current.currentTime);
    }
  };

  const updateWaveType = (wave: WaveType) => {
    setWaveType(wave);
    if (oscillatorRef.current) {
      oscillatorRef.current.type = wave;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodeRef.current && audioContextRef.current) {
      const vol = isMuted ? (volume / 100) : 0;
      gainNodeRef.current.gain.setValueAtTime(vol, audioContextRef.current.currentTime);
    }
  };

  const exportTone = async () => {
    if (!audioContextRef.current) return;

    try {
      // Create offline audio context for rendering
      const offlineContext = new OfflineAudioContext(1, 48000 * duration, 48000);
      
      const oscillator = offlineContext.createOscillator();
      const gainNode = offlineContext.createGain();
      
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, 0);
      oscillator.connect(gainNode);
      gainNode.connect(offlineContext.destination);

      const vol = volume / 100;
      
      if (useEnvelope) {
        // Apply ADSR envelope
        gainNode.gain.setValueAtTime(0, 0);
        gainNode.gain.linearRampToValueAtTime(vol, attack);
        gainNode.gain.linearRampToValueAtTime(vol * sustain, attack + decay);
        gainNode.gain.setValueAtTime(vol * sustain, duration - release);
        gainNode.gain.linearRampToValueAtTime(0, duration);
      } else {
        gainNode.gain.setValueAtTime(vol, 0);
      }

      oscillator.start(0);
      oscillator.stop(duration);

      const audioBuffer = await offlineContext.startRendering();
      
      // Convert to WAV
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tone_${frequency}Hz_${waveType}_${duration}s.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Tone Exported",
        description: `Exported ${duration}s ${frequency}Hz ${waveType} tone`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export tone",
      });
    }
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

  const handleBackClick = () => {
    stopTone();
    navigate('/audio-tools');
  };

  const getNoteName = (freq: number): string => {
    for (const [note, frequencies] of Object.entries(notes)) {
      for (let i = 0; i < frequencies.length; i++) {
        if (Math.abs(frequencies[i] - freq) < 1) {
          return `${note}${octaveNames[i]}`;
        }
      }
    }
    return `${freq.toFixed(1)} Hz`;
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
              <div className="font-ms-sans">📳 Tone Generator</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-6">
            {/* Frequency Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-black mb-2">{frequency.toFixed(1)} Hz</div>
              <div className="text-lg text-gray-600">{getNoteName(frequency)}</div>
              <div className="text-sm text-gray-500 capitalize">{waveType} Wave</div>
            </div>

            {/* Play/Stop Button */}
            <div className="flex justify-center mb-6">
              <button
                className={`win98-btn p-4 ${isPlaying ? 'bg-red-100' : 'bg-green-100'}`}
                onClick={toggleTone}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-red-600" />
                ) : (
                  <Play className="h-8 w-8 text-green-600" />
                )}
              </button>
            </div>

            {/* Frequency Control */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Frequency Control</h3>
              
              {/* Frequency Slider */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Frequency: {frequency.toFixed(1)} Hz
                </label>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => updateFrequency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Manual Input */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">Manual Entry:</label>
                <input
                  type="number"
                  min="20"
                  max="20000"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => updateFrequency(parseFloat(e.target.value) || 440)}
                  className="w-32 p-1 border border-gray-300 rounded text-black text-center"
                />
              </div>

              {/* Musical Notes */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Musical Notes:</label>
                <div className="grid grid-cols-5 gap-2">
                  {octaveNames.map((octave, octaveIndex) => (
                    <div key={octave} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Octave {octave}</div>
                      <div className="space-y-1">
                        {Object.entries(notes).map(([note, frequencies]) => (
                          <button
                            key={`${note}${octave}`}
                            className={`win98-btn px-2 py-0.5 text-xs w-full ${
                              Math.abs(frequencies[octaveIndex] - frequency) < 1 ? 'shadow-win98-in' : ''
                            }`}
                            onClick={() => updateFrequency(frequencies[octaveIndex])}
                          >
                            {note}{octave}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Waveform & Volume Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                <h3 className="text-sm font-medium text-black mb-3">Waveform</h3>
                <div className="space-y-2">
                  {(['sine', 'square', 'sawtooth', 'triangle'] as WaveType[]).map((wave) => (
                    <div key={wave} className="flex items-center">
                      <input
                        type="radio"
                        id={wave}
                        name="waveform"
                        checked={waveType === wave}
                        onChange={() => updateWaveType(wave)}
                        className="mr-2"
                      />
                      <label htmlFor={wave} className="text-xs text-gray-600 capitalize">
                        {wave} Wave
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                <h3 className="text-sm font-medium text-black mb-3">Volume</h3>
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
                  
                  <span className="text-xs text-gray-600 w-10">{volume}%</span>
                </div>
              </div>
            </div>

            {/* ADSR Envelope */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-black">ADSR Envelope</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="use-envelope"
                    checked={useEnvelope}
                    onChange={(e) => setUseEnvelope(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="use-envelope" className="text-xs text-gray-600">
                    Enable Envelope
                  </label>
                </div>
              </div>
              
              {useEnvelope && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Attack: {attack.toFixed(2)}s</label>
                    <input
                      type="range"
                      min="0.01"
                      max="2"
                      step="0.01"
                      value={attack}
                      onChange={(e) => setAttack(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Decay: {decay.toFixed(2)}s</label>
                    <input
                      type="range"
                      min="0.01"
                      max="2"
                      step="0.01"
                      value={decay}
                      onChange={(e) => setDecay(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sustain: {sustain.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sustain}
                      onChange={(e) => setSustain(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Release: {release.toFixed(2)}s</label>
                    <input
                      type="range"
                      min="0.01"
                      max="3"
                      step="0.01"
                      value={release}
                      onChange={(e) => setRelease(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Export Tone</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Duration (seconds):</label>
                  <input
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 2)}
                    className="w-20 p-1 border border-gray-300 rounded text-black text-center"
                  />
                </div>
                
                <button
                  className="win98-btn px-4 py-2 flex items-center gap-2"
                  onClick={exportTone}
                >
                  <Download className="h-4 w-4" />
                  Export WAV
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-blue-800">
                <strong>Instructions:</strong> Adjust frequency with the slider or click musical note buttons. 
                Choose waveform type and adjust volume. Enable ADSR envelope for shaped tones. 
                Export generates a WAV file with your settings.
              </div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default ToneGenerator; 
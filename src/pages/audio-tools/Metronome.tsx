import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const Metronome = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext>();
  const gainNodeRef = useRef<GainNode>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [subdivision, setSubdivision] = useState<1 | 2 | 4>(1); // 1 = quarter, 2 = eighth, 4 = sixteenth
  const [accent, setAccent] = useState(true);
  const [visualBeat, setVisualBeat] = useState(false);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNodeRef.current = gainNode;

        setVolume(50);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      } catch (error) {
        console.error('Error initializing Web Audio API:', error);
      }
    };

    initAudio();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Generate click sound using Web Audio API
  const generateClick = (isAccent: boolean = false) => {
    if (!audioContextRef.current || !gainNodeRef.current || isMuted) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const clickGain = audioContext.createGain();

    oscillator.connect(clickGain);
    clickGain.connect(gainNodeRef.current);

    // Different frequencies for accent and regular beats
    oscillator.frequency.setValueAtTime(
      isAccent ? 800 : 600, 
      audioContext.currentTime
    );
    oscillator.type = 'square';

    // Volume envelope for click
    clickGain.gain.setValueAtTime(0, audioContext.currentTime);
    clickGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Start/stop metronome
  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const startMetronome = () => {
    if (!audioContextRef.current) return;

    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const interval = (60 / bpm / subdivision) * 1000; // Convert BPM to milliseconds
    let beatCount = 0;

    const tick = () => {
      const isAccentBeat = accent && (beatCount % beatsPerMeasure === 0);
      generateClick(isAccentBeat);
      
      setCurrentBeat(beatCount % beatsPerMeasure);
      setVisualBeat(true);
      setTimeout(() => setVisualBeat(false), 100);
      
      beatCount++;
    };

    // Play first beat immediately
    tick();
    
    intervalRef.current = setInterval(tick, interval);
    setIsPlaying(true);

    toast({
      title: "Metronome Started",
      description: `Playing at ${bpm} BPM`,
    });
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    
    toast({
      title: "Metronome Stopped",
      description: "Metronome has been stopped",
    });
  };

  // Update metronome timing when BPM or subdivision changes
  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, subdivision]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        vol / 100, 
        audioContextRef.current.currentTime
      );
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Metronome audio enabled" : "Metronome audio disabled",
    });
  };

  const presetBPMs = [60, 80, 100, 120, 140, 160, 180, 200];

  const subdivisionNames = {
    1: 'Quarter Notes',
    2: 'Eighth Notes', 
    4: 'Sixteenth Notes'
  };

  const handleBackClick = () => {
    stopMetronome();
    navigate('/audio-tools');
  };

  const renderBeatIndicator = () => {
    const beats = [];
    for (let i = 0; i < beatsPerMeasure; i++) {
      beats.push(
        <div
          key={i}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-100 ${
            i === currentBeat && visualBeat
              ? 'bg-red-500 border-red-500 text-white scale-110'
              : i === 0 && accent
              ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
              : 'bg-gray-100 border-gray-300 text-gray-600'
          }`}
        >
          {i + 1}
        </div>
      );
    }
    return beats;
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-3xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button className="win98-btn px-2 py-0.5 h-6 text-xs" onClick={handleBackClick}>
                ← Back
              </button>
              <div className="font-ms-sans">⏱️ Metronome</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-6">
            {/* Main BPM Display */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-black mb-2">{bpm}</div>
              <div className="text-lg text-gray-600">BPM (Beats Per Minute)</div>
            </div>

            {/* Beat Indicator */}
            <div className="flex justify-center items-center gap-2 mb-6">
              {renderBeatIndicator()}
            </div>

            {/* Play/Stop Button */}
            <div className="flex justify-center mb-6">
              <button
                className={`win98-btn p-4 ${isPlaying ? 'bg-red-100' : 'bg-green-100'}`}
                onClick={toggleMetronome}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-red-600" />
                ) : (
                  <Play className="h-8 w-8 text-green-600" />
                )}
              </button>
            </div>

            {/* BPM Control */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Tempo Control</h3>
              
              {/* BPM Slider */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">BPM: {bpm}</label>
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* BPM Input */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">Manual BPM Entry:</label>
                <input
                  type="number"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                  className="w-24 p-1 border border-gray-300 rounded text-black text-center"
                />
              </div>

              {/* Preset BPMs */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  {presetBPMs.map((presetBpm) => (
                    <button
                      key={presetBpm}
                      className={`win98-btn px-3 py-1 text-xs ${bpm === presetBpm ? 'shadow-win98-in' : ''}`}
                      onClick={() => setBpm(presetBpm)}
                    >
                      {presetBpm}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Signature & Subdivision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                <h3 className="text-sm font-medium text-black mb-3">Time Signature</h3>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Beats per Measure:</label>
                  <select
                    value={beatsPerMeasure}
                    onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
                    className="w-full p-1 border border-gray-300 rounded text-black"
                  >
                    <option value={2}>2/4</option>
                    <option value={3}>3/4</option>
                    <option value={4}>4/4</option>
                    <option value={5}>5/4</option>
                    <option value={6}>6/8</option>
                    <option value={7}>7/8</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="accent"
                    checked={accent}
                    onChange={(e) => setAccent(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="accent" className="text-xs text-gray-600">
                    Accent first beat
                  </label>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                <h3 className="text-sm font-medium text-black mb-3">Subdivision</h3>
                
                <div className="space-y-2">
                  {Object.entries(subdivisionNames).map(([value, name]) => (
                    <div key={value} className="flex items-center">
                      <input
                        type="radio"
                        id={`sub-${value}`}
                        name="subdivision"
                        checked={subdivision === parseInt(value) as 1 | 2 | 4}
                        onChange={() => setSubdivision(parseInt(value) as 1 | 2 | 4)}
                        className="mr-2"
                      />
                      <label htmlFor={`sub-${value}`} className="text-xs text-gray-600">
                        {name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="p-4 bg-gray-50 border border-gray-300 rounded">
              <h3 className="text-sm font-medium text-black mb-3">Audio Settings</h3>
              
              <div className="flex items-center gap-3">
                <button className="win98-btn p-2" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                
                <span className="text-xs text-gray-600">Volume:</span>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={isMuted}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                
                <span className="text-xs text-gray-600 w-8">{volume}%</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-blue-800">
                <strong>Instructions:</strong> Set your desired tempo, time signature, and subdivision. 
                Click the play button to start the metronome. The first beat of each measure will be 
                accented (if enabled) and highlighted in yellow.
              </div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default Metronome; 
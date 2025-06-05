import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";
import { Grid, List, Volume2 } from 'lucide-react';

const AudioTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Define Audio tools - Comprehensive Suite (65+ tools)
  const audioTools = [
    // Core Player & Recording Tools
    { id: 'audio-player', label: 'Audio Player', icon: '🎵', category: 'Player', description: 'Custom MP3/OGG player with playlist, shuffle, loop' },
    { id: 'voice-recorder', label: 'Voice Recorder', icon: '🎙️', category: 'Recording', description: 'Browser-based mic recorder with export to WAV/MP3' },
    { id: 'metronome', label: 'Metronome', icon: '⏱️', category: 'Tools', description: 'Beat-based audio click generator with BPM control' },
    { id: 'soundboard', label: 'Soundboard', icon: '🎹', category: 'Tools', description: 'Play mapped sounds (memes, effects) on button/key press' },
    
    // Generators & Synthesis
    { id: 'tone-generator', label: 'Tone Generator', icon: '📳', category: 'Generators', description: 'Sine/square/triangle/saw tones at any frequency' },
    { id: 'white-noise-generator', label: 'White Noise Generator', icon: '📻', category: 'Generators', description: 'For focus/sleep apps' },
    { id: 'simple-synthesizer', label: 'Simple Synthesizer', icon: '🎹', category: 'Synthesis', description: 'Create tones with oscillators and envelope controls' },
    { id: 'binaural-beats', label: 'Binaural Beats Generator', icon: '🧠', category: 'Generators', description: 'Left/right channel tone difference' },
    { id: 'morse-generator', label: 'Morse Code Audio Generator', icon: '📡', category: 'Generators', description: 'Convert text to Morse code beeps' },
    
    // Visualization & Analysis
    { id: 'audio-visualizer', label: 'Audio Visualizer', icon: '📊', category: 'Visualization', description: 'Frequency bars or waveform visual synced to music' },
    { id: 'spectrum-analyzer', label: 'Frequency Spectrum Analyzer', icon: '📈', category: 'Analysis', description: 'Visual FFT representation of audio' },
    { id: 'oscilloscope', label: 'Oscilloscope View', icon: '〰️', category: 'Visualization', description: 'Time-domain waveform display in real-time' },
    { id: 'volume-meter', label: 'Volume Level Meter', icon: '📊', category: 'Analysis', description: 'Live RMS/peak decibel monitor for mic or file' },
    { id: 'waterfall-plot', label: 'Audio Waterfall Plot', icon: '🌊', category: 'Visualization', description: 'Time vs. frequency 3D FFT-like visual' },
    
    // Processing & Effects
    { id: 'equalizer', label: 'Equalizer (EQ)', icon: '🎛️', category: 'Processing', description: '3-band or 10-band EQ using Web Audio BiquadFilterNodes' },
    { id: 'audio-normalizer', label: 'Audio Normalizer', icon: '📏', category: 'Processing', description: 'Adjust amplitude to match loudness level' },
    { id: 'vocal-remover', label: 'Vocal Remover', icon: '🎤', category: 'Effects', description: 'Remove vocals using stereo phase cancellation' },
    { id: 'audio-reverser', label: 'Audio Reverser', icon: '⏪', category: 'Effects', description: 'Reverse audio buffer for playback or export' },
    { id: 'compressor', label: 'Dynamic Range Compressor', icon: '🗜️', category: 'Processing', description: 'Adjust loud/quiet audio using gain control' },
    { id: 'effects-rack', label: 'Basic Audio Effects Rack', icon: '🎛️', category: 'Effects', description: 'Add reverb, delay, distortion, etc., with sliders' },
    { id: 'noise-gate', label: 'Noise Gate/Suppressor', icon: '🔇', category: 'Processing', description: 'Remove low-level background noise using thresholds' },
    { id: 'denoiser', label: 'Spectral Denoising', icon: '🧹', category: 'Processing', description: 'Crude denoising by amplitude threshold per band' },
    { id: 'audio-watermarker', label: 'Audio Watermarker', icon: '🏷️', category: 'Processing', description: 'Add custom tone/snippet periodically in audio' },
    
    // Editing & Manipulation
    { id: 'audio-trimmer', label: 'Audio Trimmer/Cutter', icon: '✂️', category: 'Editing', description: 'Select start/end and cut part of an audio file' },
    { id: 'offline-editor', label: 'Offline Audio Editor', icon: '✏️', category: 'Editing', description: 'Open local audio files, edit waveform, export' },
    { id: 'timeline-editor', label: 'DAW-style Timeline Editor', icon: '🎬', category: 'Editing', description: 'Drag/drop clips on timeline with playback' },
    { id: 'podcast-editor', label: 'Podcast Editor', icon: '🎧', category: 'Editing', description: 'Multi-track waveform editor with cut/copy/paste' },
    { id: 'glitch-art', label: 'Audio Glitch Art Tool', icon: '💥', category: 'Creative', description: 'Modify byte-level WAV headers for glitch effects' },
    
    // Time & Pitch Effects
    { id: 'pitch-shifter', label: 'Pitch Shifter', icon: '🎼', category: 'Effects', description: 'Change pitch without altering playback speed' },
    { id: 'tempo-changer', label: 'Tempo Changer', icon: '⚡', category: 'Effects', description: 'Change playback speed without affecting pitch' },
    
    // Mixing & DJ Tools
    { id: 'audio-mixer', label: 'Multi-track Mixer', icon: '🎚️', category: 'Mixing', description: 'Load and adjust volume/pan on multiple tracks' },
    { id: 'dj-console', label: 'Web-based DJ Console', icon: '🎧', category: 'DJ', description: 'Crossfade, pitch, and cue between two tracks' },
    { id: 'surround-simulator', label: 'Surround Sound Simulator', icon: '🔊', category: 'Mixing', description: 'Pan audio between L/R channels with UI' },
    
    // Creation & Production
    { id: 'drum-machine', label: 'Online Drum Machine', icon: '🥁', category: 'Creation', description: 'Step sequencer that plays percussive sounds' },
    { id: 'loop-station', label: 'Loop Station', icon: '🔁', category: 'Recording', description: 'Record and loop multiple audio layers' },
    { id: 'soundfont-player', label: 'Web SoundFont Player', icon: '🎼', category: 'Creation', description: 'Use SoundFonts for playing MIDI-like notes' },
    { id: 'audio-sandbox', label: 'Web Audio Sandbox', icon: '🧪', category: 'Creative', description: 'Drag-n-drop node-based Web Audio builder' },
    { id: 'signal-chain', label: 'Audio Signal Chain Simulator', icon: '🔗', category: 'Production', description: 'Simulate order of effects (compressor → delay → reverb)' },
    
    // Conversion & Import/Export
    { id: 'audio-converter', label: 'Audio Converter', icon: '🔄', category: 'Conversion', description: 'Convert formats using JavaScript libraries (WAV ↔ MP3)' },
    
    // Detection & Analysis
    { id: 'beat-detector', label: 'Beat Detector (RMS/Peak)', icon: '💓', category: 'Analysis', description: 'Detect beats using RMS energy or peak volume' },
    { id: 'guitar-tuner', label: 'Online Guitar Tuner', icon: '🎸', category: 'Tuning', description: 'Analyze pitch via mic input and match to notes' },
    { id: 'notes-recognizer', label: 'Musical Notes Recognizer', icon: '🎵', category: 'Analysis', description: 'Use FFT to match tone frequency to note' },
    { id: 'birdsong-identifier', label: 'Birdsong Identifier', icon: '🐦', category: 'Analysis', description: 'Use FFT fingerprints and human input matching' },
    { id: 'mic-frequency-viewer', label: 'Microphone Frequency Response Viewer', icon: '🎤', category: 'Analysis', description: 'Visualize how different frequencies are captured' },
    
    // MIDI & External Input
    { id: 'midi-keyboard', label: 'Web MIDI Keyboard', icon: '🎹', category: 'MIDI', description: 'Play audio using connected MIDI keyboard' },
    
    // Educational & Training
    { id: 'music-theory-trainer', label: 'Music Theory Trainer', icon: '🎓', category: 'Education', description: 'Play intervals, scales, chords to train ear' },
    { id: 'rhythm-trainer', label: 'Rhythm Trainer', icon: '🥁', category: 'Education', description: 'Play back rhythms and require user tap match' },
    
    // Communication & Accessibility
    { id: 'audio-chat', label: 'Real-Time Audio Chat', icon: '💬', category: 'Communication', description: 'Use WebRTC only, no backend APIs' },
    { id: 'text-to-morse', label: 'Text-to-Morse-Audio Translator', icon: '📢', category: 'Accessibility', description: 'Converts text to Morse code and plays beeps' },
    { id: 'audio-captcha', label: 'Audio CAPTCHA', icon: '🔒', category: 'Accessibility', description: 'Simple tones or spoken math problems for accessibility' },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('audioToolsIconPositions');
    const savedViewMode = localStorage.getItem('audioToolsViewMode') as 'grid' | 'list' || 'grid';
    setViewMode(savedViewMode);
    
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      audioTools.forEach((tool, index) => {
        const row = Math.floor(index / 5); // 5 icons per row
        const col = index % 5;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 120), // Horizontal spacing
          y: 20 + (row * 100)  // Vertical spacing
        };
      });
      setIconPositions(defaultPositions);
      localStorage.setItem('audioToolsIconPositions', JSON.stringify(defaultPositions));
    }
  }, []);
  
  // Handle icon position change
  const handlePositionChange = (id: string, position: { x: number, y: number }) => {
    const newPositions = { ...iconPositions, [id]: position };
    setIconPositions(newPositions);
    localStorage.setItem('audioToolsIconPositions', JSON.stringify(newPositions));
  };

  const handleIconClick = (id: string) => {
    // Define which tools have working implementations
    const toolsWithRoutes = [
      'audio-player', 'voice-recorder', 'metronome', 'soundboard', 
      'tone-generator', 'white-noise-generator', 'audio-converter', 
      'audio-normalizer', 'audio-visualizer'
    ];
    
    if (toolsWithRoutes.includes(id)) {
      navigate(`/audio-tools/${id}`);
    } else {
      toast({
        title: "Coming Soon! 🎵",
        description: `${audioTools.find(tool => tool.id === id)?.label} tool is coming soon!`,
      });
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('audioToolsViewMode', newMode);
  };

  const renderGridView = () => (
    <>
      {audioTools.map((tool) => (
        <Win98DesktopIcon
          key={tool.id}
          id={tool.id}
          icon={<span className="text-2xl">{tool.icon}</span>}
          label={tool.label}
          position={iconPositions[tool.id]}
          onPositionChange={handlePositionChange}
          onClick={() => handleIconClick(tool.id)}
          variant="window"
        />
      ))}
    </>
  );

  const renderListView = () => {
    const groupedTools = audioTools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, typeof audioTools>);

    return (
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-4">
            <div className="bg-gray-200 border border-gray-300 p-2 font-bold text-sm text-black rounded-t flex items-center">
              <Volume2 className="h-4 w-4 mr-2" />
              {category} Tools ({tools.length})
            </div>
            <div className="bg-white border border-gray-300 rounded-b">
              {tools.map((tool, index) => (
                <div 
                  key={tool.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-blue-100 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleIconClick(tool.id)}
                >
                  <span className="mr-3 text-lg">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="text-black text-sm font-medium">{tool.label}</div>
                    <div className="text-gray-600 text-xs">{tool.description}</div>
                  </div>
                  <div className="w-20 text-gray-600 text-xs">{tool.category}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-6xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">🎵 Audio Tools</div>
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
          
          {/* Toolbar */}
          <div className="bg-win98-gray border-b border-win98-btnshadow p-2 flex items-center gap-2">
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'grid' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <Grid className="h-3 w-3" />
              Grid
            </button>
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'list' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <List className="h-3 w-3" />
              List
            </button>
            <div className="ml-auto text-xs text-gray-600">
              {audioTools.length} Audio Tools Available
            </div>
          </div>

          <div className={`bg-white min-h-[600px] ${viewMode === 'grid' ? 'relative overflow-auto' : ''}`}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-600 flex items-center">
            <span>🎵 Audio Tools Suite - Professional audio processing and creation tools</span>
            <div className="ml-auto flex items-center gap-4">
              <span>Tools: {audioTools.length}</span>
              <span>Categories: {new Set(audioTools.map(t => t.category)).size}</span>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioTools; 
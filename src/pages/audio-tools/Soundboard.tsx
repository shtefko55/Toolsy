import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Play, Trash2, Volume2, Keyboard, Settings } from 'lucide-react';

interface SoundButton {
  id: string;
  name: string;
  key: string;
  file: File;
  url: string;
  volume: number;
}

const Soundboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const [sounds, setSounds] = useState<SoundButton[]>([]);
  const [masterVolume, setMasterVolume] = useState(100);
  const [keyboardMode, setKeyboardMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  // Predefined keyboard keys for sound mapping
  const availableKeys = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
  ];

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!keyboardMode) return;
      
      const key = event.key.toUpperCase();
      const sound = sounds.find(s => s.key === key);
      
      if (sound) {
        event.preventDefault();
        playSound(sound.id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sounds, keyboardMode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    if (audioFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please select valid audio files.",
      });
      return;
    }

    const usedKeys = sounds.map(s => s.key);
    const availableKeysFiltered = availableKeys.filter(key => !usedKeys.includes(key));

    if (availableKeysFiltered.length < audioFiles.length) {
      toast({
        title: "Too Many Files",
        description: `Can only add ${availableKeysFiltered.length} more sounds (no available keys).`,
      });
      return;
    }

    const newSounds: SoundButton[] = audioFiles.map((file, index) => ({
      id: `sound-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      key: availableKeysFiltered[index],
      file,
      url: URL.createObjectURL(file),
      volume: 100
    }));

    setSounds(prev => [...prev, ...newSounds]);
    
    toast({
      title: "Sounds Added",
      description: `Added ${audioFiles.length} sound(s) to soundboard.`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const playSound = (soundId: string) => {
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    // Create or get audio element
    if (!audioRefs.current[soundId]) {
      const audio = new Audio(sound.url);
      audioRefs.current[soundId] = audio;
    }

    const audio = audioRefs.current[soundId];
    audio.volume = (sound.volume / 100) * (masterVolume / 100);
    
    // Stop any currently playing instance and restart
    audio.currentTime = 0;
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play sound file.",
      });
    });

    // Visual feedback
    setPlayingSound(soundId);
    setTimeout(() => setPlayingSound(null), 200);

    // Show keyboard feedback
    if (keyboardMode) {
      toast({
        title: `🎵 ${sound.name}`,
        description: `Played with key: ${sound.key}`,
      });
    }
  };

  const removeSound = (soundId: string) => {
    const sound = sounds.find(s => s.id === soundId);
    if (sound) {
      URL.revokeObjectURL(sound.url);
      if (audioRefs.current[soundId]) {
        delete audioRefs.current[soundId];
      }
      setSounds(prev => prev.filter(s => s.id !== soundId));
      
      toast({
        title: "Sound Removed",
        description: `"${sound.name}" has been removed.`,
      });
    }
  };

  const updateSoundVolume = (soundId: string, volume: number) => {
    setSounds(prev => prev.map(s => 
      s.id === soundId ? { ...s, volume } : s
    ));
  };

  const updateSoundKey = (soundId: string, newKey: string) => {
    const isKeyUsed = sounds.some(s => s.key === newKey && s.id !== soundId);
    if (isKeyUsed) {
      toast({
        title: "Key Already Used",
        description: `Key "${newKey}" is already assigned to another sound.`,
      });
      return;
    }

    setSounds(prev => prev.map(s => 
      s.id === soundId ? { ...s, key: newKey } : s
    ));
  };

  const clearAllSounds = () => {
    sounds.forEach(sound => {
      URL.revokeObjectURL(sound.url);
    });
    setSounds([]);
    audioRefs.current = {};
    
    toast({
      title: "All Sounds Cleared",
      description: "Soundboard has been cleared.",
    });
  };

  const handleBackClick = () => {
    // Clean up audio URLs
    sounds.forEach(sound => URL.revokeObjectURL(sound.url));
    navigate('/audio-tools');
  };

  const renderSoundButton = (sound: SoundButton) => {
    const isPlaying = playingSound === sound.id;
    
    return (
      <div
        key={sound.id}
        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isPlaying 
            ? 'border-blue-500 bg-blue-100 scale-95' 
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
        onClick={() => playSound(sound.id)}
      >
        {/* Keyboard Key Display */}
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded font-mono">
          {sound.key}
        </div>

        {/* Sound Name */}
        <div className="text-sm font-medium text-black mb-2 pr-8">
          {sound.name}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-3 w-3 text-gray-500" />
          <input
            type="range"
            min="0"
            max="100"
            value={sound.volume}
            onChange={(e) => {
              e.stopPropagation();
              updateSoundVolume(sound.id, parseInt(e.target.value));
            }}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-xs text-gray-500 w-8">{sound.volume}%</span>
        </div>

        {/* Key Assignment */}
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="h-3 w-3 text-gray-500" />
          <select
            value={sound.key}
            onChange={(e) => {
              e.stopPropagation();
              updateSoundKey(sound.id, e.target.value);
            }}
            className="flex-1 text-xs p-1 border border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            {availableKeys.map(key => (
              <option 
                key={key} 
                value={key}
                disabled={sounds.some(s => s.key === key && s.id !== sound.id)}
              >
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* Remove Button */}
        <button
          className="absolute bottom-2 right-2 win98-btn p-1 hover:bg-red-100"
          onClick={(e) => {
            e.stopPropagation();
            removeSound(sound.id);
          }}
          title="Remove Sound"
        >
          <Trash2 className="h-3 w-3 text-red-600" />
        </button>

        {/* Play Button */}
        <button
          className="win98-btn p-2 w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            playSound(sound.id);
          }}
        >
          <Play className="h-4 w-4 mx-auto" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-6xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button className="win98-btn px-2 py-0.5 h-6 text-xs" onClick={handleBackClick}>
                ← Back
              </button>
              <div className="font-ms-sans">🎹 Soundboard</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            {/* Controls */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Soundboard Controls</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="keyboard-mode"
                      checked={keyboardMode}
                      onChange={(e) => setKeyboardMode(e.target.checked)}
                    />
                    <label htmlFor="keyboard-mode" className="text-sm text-black">
                      Keyboard Mode
                    </label>
                  </div>
                  
                  <button
                    className="win98-btn px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-3 w-3" />
                    Settings
                  </button>
                </div>
              </div>

              {/* Master Volume */}
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-black">Master Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-600 w-10">{masterVolume}%</span>
              </div>

              {/* Add Sounds Button */}
              <div className="flex items-center gap-4">
                <button
                  className="win98-btn px-4 py-2 flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Add Sounds
                </button>

                {sounds.length > 0 && (
                  <button
                    className="win98-btn px-4 py-2 text-red-600"
                    onClick={clearAllSounds}
                  >
                    Clear All
                  </button>
                )}

                <div className="ml-auto text-sm text-gray-600">
                  {sounds.length} / {availableKeys.length} sounds loaded
                </div>
              </div>
            </div>

            {/* Instructions */}
            {keyboardMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800">
                  <strong>Keyboard Mode Active:</strong> Press the assigned keys to play sounds instantly! 
                  Each sound shows its key in the top-right corner.
                </div>
              </div>
            )}

            {/* Soundboard Grid */}
            {sounds.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Upload className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-lg font-medium">No sounds loaded</div>
                  <div className="text-sm">Click "Add Sounds" to upload audio files</div>
                </div>
                <button
                  className="win98-btn px-6 py-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add Your First Sound
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sounds.map(renderSoundButton)}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Usage Stats */}
            {sounds.length > 0 && (
              <div className="mt-6 p-3 bg-gray-50 border border-gray-300 rounded">
                <div className="text-xs text-gray-600 flex items-center justify-between">
                  <span>💡 Tip: You can adjust individual sound volumes and reassign keyboard keys</span>
                  <span>Available keys: {availableKeys.length - sounds.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default Soundboard; 
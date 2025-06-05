import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Plus, X } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  file: File;
  duration: number;
  url: string;
}

const AudioPlayer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();

  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Audio API for visualization
  useEffect(() => {
    const initAudioContext = async () => {
      if (!audioRef.current || audioContextRef.current) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (error) {
        console.error('Error initializing Web Audio API:', error);
      }
    };

    initAudioContext();
  }, []);

  // Visualizer animation
  useEffect(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      if (!analyserRef.current || !isPlaying) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const r = Math.floor(barHeight + 25 * (i / bufferLength));
        const g = Math.floor(250 * (i / bufferLength));
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      requestAnimationFrame(renderFrame);
    };

    if (isPlaying) {
      renderFrame();
    }
  }, [isPlaying]);

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

    const newTracks: Track[] = audioFiles.map((file, index) => ({
      id: `track-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      duration: 0,
      url: URL.createObjectURL(file)
    }));

    setPlaylist(prev => [...prev, ...newTracks]);
    
    toast({
      title: "Files Added",
      description: `Added ${audioFiles.length} audio file(s) to playlist.`,
    });
  };

  const playTrack = (index: number) => {
    if (!playlist[index] || !audioRef.current) return;

    setCurrentTrackIndex(index);
    audioRef.current.src = playlist[index].url;
    audioRef.current.play();
    setIsPlaying(true);

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src && playlist.length > 0) {
        playTrack(currentTrackIndex);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    playTrack(nextIndex);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    }
    playTrack(prevIndex);
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

  const handleTrackEnd = () => {
    switch (repeatMode) {
      case 'one':
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        break;
      case 'all':
        playNext();
        break;
      default:
        if (currentTrackIndex < playlist.length - 1) {
          playNext();
        } else {
          setIsPlaying(false);
        }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    toast({
      title: isShuffled ? "Shuffle Off" : "Shuffle On",
      description: isShuffled ? "Playing in order" : "Playing randomly",
    });
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    
    const modeNames = { none: 'Off', one: 'Repeat One', all: 'Repeat All' };
    toast({
      title: `Repeat ${modeNames[nextMode]}`,
      description: `Repeat mode: ${modeNames[nextMode]}`,
    });
  };

  const removeTrack = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    
    if (index === currentTrackIndex && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (newPlaylist.length > 0) {
        const newIndex = Math.min(currentTrackIndex, newPlaylist.length - 1);
        setCurrentTrackIndex(newIndex);
      }
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    navigate('/audio-tools');
  };

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button className="win98-btn px-2 py-0.5 h-6 text-xs" onClick={handleBackClick}>
                ← Back
              </button>
              <div className="font-ms-sans">🎵 Audio Player</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            {/* Audio Visualizer */}
            <div className="mb-4 border border-gray-300 rounded">
              <canvas 
                ref={canvasRef}
                width="600"
                height="100"
                className="w-full h-24 bg-black rounded"
              />
            </div>

            {/* Current Track Info */}
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
              <div className="text-lg font-medium text-black mb-1">
                {currentTrack ? currentTrack.name : 'No track selected'}
              </div>
              <div className="text-sm text-gray-600">
                {playlist.length > 0 ? `Track ${currentTrackIndex + 1} of ${playlist.length}` : 'Empty playlist'}
              </div>
            </div>

            {/* Player Controls */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded">
              {/* Transport Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  className={`win98-btn p-2 ${isShuffled ? 'shadow-win98-in' : ''}`}
                  onClick={toggleShuffle}
                  title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                
                <button className="win98-btn p-2" onClick={playPrevious}>
                  <SkipBack className="h-4 w-4" />
                </button>
                
                <button className="win98-btn p-3" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                
                <button className="win98-btn p-2" onClick={playNext}>
                  <SkipForward className="h-4 w-4" />
                </button>
                
                <button
                  className={`win98-btn p-2 ${repeatMode !== 'none' ? 'shadow-win98-in' : ''}`}
                  onClick={toggleRepeat}
                  title={`Repeat: ${repeatMode}`}
                >
                  <Repeat className="h-4 w-4" />
                  {repeatMode === 'one' && <span className="text-xs ml-1">1</span>}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-3">
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

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button className="win98-btn p-1" onClick={toggleMute}>
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

            {/* Playlist */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-black">Playlist ({playlist.length})</h3>
                <div className="flex gap-2">
                  <button
                    className="win98-btn px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-3 w-3" />
                    Add Files
                  </button>
                  <button
                    className="win98-btn px-3 py-1 text-xs"
                    onClick={() => setPlaylist([])}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                {playlist.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No tracks in playlist. Click "Add Files" to get started.
                  </div>
                ) : (
                  playlist.map((track, index) => (
                    <div
                      key={track.id}
                      className={`flex items-center p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        index === currentTrackIndex ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => playTrack(index)}
                    >
                      <div className="flex-1">
                        <div className="text-sm text-black">{track.name}</div>
                      </div>
                      <button
                        className="win98-btn p-1 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrack(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleTrackEnd}
              preload="metadata"
            />
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default AudioPlayer; 
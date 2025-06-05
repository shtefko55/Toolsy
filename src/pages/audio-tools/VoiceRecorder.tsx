import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Mic, Square, Play, Pause, Download, Trash2, Volume2 } from 'lucide-react';

interface Recording {
  id: string;
  name: string;
  blob: Blob;
  duration: number;
  timestamp: Date;
  url: string;
}

const VoiceRecorder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(100);
  const [recordingName, setRecordingName] = useState('');

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const newRecording: Recording = {
          id: `recording-${Date.now()}`,
          name: recordingName || `Recording ${recordings.length + 1}`,
          blob,
          duration: recordingTime,
          timestamp: new Date(),
          url
        };

        setRecordings(prev => [...prev, newRecording]);
        setRecordingName('');
        
        toast({
          title: "Recording Saved",
          description: `"${newRecording.name}" saved successfully.`,
        });
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "Recording Started",
        description: "Recording audio from microphone...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please grant permission.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      if (playingId === recording.id) {
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        audioRef.current.src = recording.url;
        audioRef.current.volume = volume / 100;
        audioRef.current.play();
        setPlayingId(recording.id);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
      setRecordings(prev => prev.filter(r => r.id !== id));
      
      if (playingId === id) {
        setPlayingId(null);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      
      toast({
        title: "Recording Deleted",
        description: "Recording has been removed.",
      });
    }
  };

  const downloadRecording = async (recording: Recording, format: 'webm' | 'wav') => {
    try {
      let blob = recording.blob;
      let filename = `${recording.name}.${format}`;

      if (format === 'wav') {
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const wavBlob = audioBufferToWav(audioBuffer);
        blob = wavBlob;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading "${filename}"...`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download recording.",
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

    const channelData = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const handleBackClick = () => {
    stopRecording();
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
              <div className="font-ms-sans">🎙️ Voice Recorder</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow">□</button>
              <button onClick={handleBackClick} className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow hover:bg-red-100">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
              <div className="text-center mb-4">
                <div className="text-lg font-medium text-black mb-2">
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </div>
                <div className="text-2xl font-mono text-red-600">
                  {formatTime(recordingTime)}
                </div>
              </div>

              {!isRecording && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-1">
                    Recording Name (optional):
                  </label>
                  <input
                    type="text"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder={`Recording ${recordings.length + 1}`}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <button
                    className="win98-btn p-4 bg-red-100 hover:bg-red-200"
                    onClick={startRecording}
                  >
                    <Mic className="h-6 w-6 text-red-600" />
                  </button>
                ) : (
                  <button
                    className="win98-btn p-4 bg-gray-100 hover:bg-gray-200"
                    onClick={stopRecording}
                  >
                    <Square className="h-6 w-6 text-gray-600" />
                  </button>
                )}
              </div>

              <div className="text-center mt-2 text-xs text-gray-600">
                {!isRecording ? 'Click the microphone to start recording' : 'Click the square to stop recording'}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-black">Playback Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-10">{volume}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-black">Recordings ({recordings.length})</h3>
                {recordings.length > 0 && (
                  <button
                    className="win98-btn px-3 py-1 text-xs"
                    onClick={() => {
                      recordings.forEach(r => URL.revokeObjectURL(r.url));
                      setRecordings([]);
                      setPlayingId(null);
                      toast({
                        title: "All Recordings Deleted",
                        description: "All recordings have been cleared.",
                      });
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="border border-gray-300 rounded">
                {recordings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No recordings yet. Click the microphone button to start recording.
                  </div>
                ) : (
                  recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className="flex items-center p-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{recording.name}</div>
                        <div className="text-xs text-gray-600">
                          Duration: {formatTime(recording.duration)} • 
                          Recorded: {formatDate(recording.timestamp)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="win98-btn p-2"
                          onClick={() => playRecording(recording)}
                          title={playingId === recording.id ? 'Pause' : 'Play'}
                        >
                          {playingId === recording.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          className="win98-btn px-2 py-1 text-xs"
                          onClick={() => downloadRecording(recording, 'webm')}
                          title="Download as WebM"
                        >
                          WebM
                        </button>

                        <button
                          className="win98-btn px-2 py-1 text-xs"
                          onClick={() => downloadRecording(recording, 'wav')}
                          title="Download as WAV"
                        >
                          WAV
                        </button>

                        <button
                          className="win98-btn p-2 hover:bg-red-100"
                          onClick={() => deleteRecording(recording.id)}
                          title="Delete Recording"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <audio
              ref={audioRef}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default VoiceRecorder; 
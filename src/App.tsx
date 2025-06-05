import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TestPage from "./pages/TestPage";
import TextTools from "./pages/TextTools";
import AudioTools from "./pages/AudioTools";
import ImageTools from "./pages/ImageToolsSimple";
import ImageCompressor from "./pages/image-tools/ImageCompressor";
import AudioPlayer from "./pages/audio-tools/AudioPlayer";
import VoiceRecorder from "./pages/audio-tools/VoiceRecorder";
import Metronome from "./pages/audio-tools/Metronome";
import Soundboard from "./pages/audio-tools/Soundboard";
import ToneGenerator from "./pages/audio-tools/ToneGenerator";
import WhiteNoiseGenerator from "./pages/audio-tools/WhiteNoiseGenerator";
import AudioConverter from "./pages/audio-tools/AudioConverter";
import AudioConverterServer from "./pages/audio-tools/AudioConverterServer";
import AudioNormalizer from "./pages/audio-tools/AudioNormalizer";
import AudioVisualizer from "./pages/audio-tools/AudioVisualizer";
import VideoDownloader from "./pages/VideoDownloader";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/text-tools" element={<TextTools />} />
            <Route path="/audio-tools" element={<AudioTools />} />
            <Route path="/audio-tools/audio-player" element={<AudioPlayer />} />
            <Route path="/audio-tools/voice-recorder" element={<VoiceRecorder />} />
            <Route path="/audio-tools/metronome" element={<Metronome />} />
            <Route path="/audio-tools/soundboard" element={<Soundboard />} />
            <Route path="/audio-tools/tone-generator" element={<ToneGenerator />} />
            <Route path="/audio-tools/white-noise-generator" element={<WhiteNoiseGenerator />} />
            <Route path="/audio-tools/audio-converter" element={<AudioConverter />} />
          <Route path="/audio-tools/audio-converter-pro" element={<AudioConverterServer />} />
            <Route path="/audio-tools/audio-normalizer" element={<AudioNormalizer />} />
            <Route path="/audio-tools/audio-visualizer" element={<AudioVisualizer />} />
            <Route path="/image-tools" element={<ImageTools />} />
            <Route path="/image-tools/image-compressor" element={<ImageCompressor />} />
            <Route path="/video-downloader" element={<VideoDownloader />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

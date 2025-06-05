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
            <Route path="/image-tools" element={<ImageTools />} />
            <Route path="/image-tools/image-compressor" element={<ImageCompressor />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

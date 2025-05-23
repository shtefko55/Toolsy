
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import TextConverter from "./pages/TextConverter";
import TextTools from "./pages/TextTools";
import TextEditor from "./pages/text-tools/TextEditor";
import WordCombiner from "./pages/text-tools/WordCombiner";
import MD5Generator from "./pages/text-tools/MD5Generator";
import InvisibleCharGenerator from "./pages/text-tools/InvisibleCharGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/text-tools" element={<TextTools />} />
          <Route path="/text-tools/text-converter" element={<TextConverter />} />
          <Route path="/text-tools/text-editor" element={<TextEditor />} />
          <Route path="/text-tools/word-combiner" element={<WordCombiner />} />
          <Route path="/text-tools/md5-generator" element={<MD5Generator />} />
          <Route path="/text-tools/invisible-char-generator" element={<InvisibleCharGenerator />} />
          {/* Redirect old path to new one */}
          <Route path="/text-converter" element={<Navigate to="/text-tools/text-converter" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

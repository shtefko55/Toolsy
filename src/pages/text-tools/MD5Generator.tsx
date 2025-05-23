
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

const MD5Generator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [input, setInput] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  
  const handleBackClick = () => {
    navigate('/text-tools');
  };

  const generateMD5 = async () => {
    if (!input.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter text to hash",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert the string to an ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      // Generate the hash using the SubtleCrypto API
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      
      // Convert the hash to a hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHash(hashHex);
      
      toast({
        title: "MD5 Generated",
        description: "Hash has been calculated successfully",
      });
    } catch (error) {
      console.error("Error generating MD5:", error);
      toast({
        title: "Error",
        description: "Failed to generate MD5 hash",
        variant: "destructive"
      });
    }
  };

  const handleCopy = () => {
    if (!hash) {
      toast({
        title: "Nothing to Copy",
        description: "Generate a hash first",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(hash);
    toast({
      title: "Copied",
      description: "MD5 hash copied to clipboard",
    });
  };

  const handleClear = () => {
    setInput('');
    setHash('');
    toast({
      title: "Cleared",
      description: "Input and hash have been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">MD5 Generator</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-win98-btnface">
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Input Text:</div>
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to generate MD5 hash..."
                className="h-32 win98-input"
              />
            </div>
            
            <div className="flex justify-center mb-4">
              <Button 
                onClick={generateMD5} 
                className="win98-btn"
                disabled={!input.trim()}
              >
                Generate MD5 Hash
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">MD5 Hash:</div>
              <div className="win98-input h-10 p-2 bg-white flex items-center font-mono overflow-x-auto">
                {hash || "MD5 hash will appear here"}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={handleCopy} 
                className="win98-btn"
                disabled={!hash}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Hash
              </Button>
              <Button 
                onClick={handleClear} 
                className="win98-btn"
                disabled={!input && !hash}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            
            <div className="mt-4 text-xs border-t border-win98-btnshadow pt-4">
              <p className="font-bold mb-1">About MD5:</p>
              <p>MD5 (Message Digest Algorithm 5) is a widely used cryptographic hash function that produces a 128-bit (16-byte) hash value. Note that MD5 is no longer considered secure for cryptographic purposes due to vulnerabilities.</p>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default MD5Generator;

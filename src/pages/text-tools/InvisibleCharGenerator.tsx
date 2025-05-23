
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Download, Trash2, Eye, EyeOff } from 'lucide-react';

const InvisibleCharGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [showInvisible, setShowInvisible] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(0);
  
  // Invisible characters collection
  const invisibleChars = [
    { name: 'Zero Width Space', char: '\u200B', code: 'U+200B' },
    { name: 'Zero Width Non-Joiner', char: '\u200C', code: 'U+200C' },
    { name: 'Zero Width Joiner', char: '\u200D', code: 'U+200D' },
    { name: 'Zero Width No-Break Space', char: '\uFEFF', code: 'U+FEFF' },
    { name: 'Word Joiner', char: '\u2060', code: 'U+2060' },
    { name: 'Hair Space', char: '\u200A', code: 'U+200A' },
    { name: 'Soft Hyphen', char: '\u00AD', code: 'U+00AD' },
  ];
  
  const handleBackClick = () => {
    navigate('/text-tools');
  };

  const insertInvisibleChar = (char: string) => {
    const newOutput = output + char;
    setOutput(newOutput);
    setCharCount(newOutput.length);
    
    toast({
      title: "Character Added",
      description: "Invisible character has been added",
    });
  };

  const handleCopy = () => {
    if (!output) {
      toast({
        title: "Nothing to Copy",
        description: "Generate invisible characters first",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied",
      description: "Invisible characters copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!output) {
      toast({
        title: "Nothing to Download",
        description: "Generate invisible characters first",
        variant: "destructive"
      });
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([output], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'invisible-characters.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded",
      description: "Invisible characters saved to file",
    });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setCharCount(0);
    toast({
      title: "Cleared",
      description: "All fields have been cleared",
    });
  };

  const insertBetweenChars = (charIndex: number) => {
    if (!input) {
      toast({
        title: "Missing Input",
        description: "Please enter text first",
        variant: "destructive"
      });
      return;
    }
    
    const char = invisibleChars[charIndex].char;
    const result = input.split('').join(char);
    setOutput(result);
    setCharCount(result.length);
    
    toast({
      title: "Characters Inserted",
      description: `Invisible characters inserted between each character`,
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
              <div className="font-ms-sans">Invisible Character Generator</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-win98-btnface">
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Input Text (Optional):</div>
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to add invisible characters between letters..."
                className="h-24 win98-input"
              />
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Available Invisible Characters:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {invisibleChars.map((invisibleChar, index) => (
                  <Button 
                    key={invisibleChar.code} 
                    className="win98-btn text-left"
                    onClick={() => insertInvisibleChar(invisibleChar.char)}
                  >
                    <span>{invisibleChar.name} ({invisibleChar.code})</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Actions:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {invisibleChars.map((invisibleChar, index) => (
                  <Button 
                    key={`action-${invisibleChar.code}`}
                    className="win98-btn text-left"
                    onClick={() => insertBetweenChars(index)}
                    disabled={!input}
                  >
                    Insert {invisibleChar.name} between each character
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold">Result:</div>
                <Button 
                  className="win98-btn h-6 py-0 px-2 text-xs"
                  onClick={() => setShowInvisible(!showInvisible)}
                >
                  {showInvisible ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  {showInvisible ? "Hide Markers" : "Show Markers"}
                </Button>
              </div>
              <div 
                className="win98-input min-h-[80px] p-2 bg-white overflow-y-auto whitespace-pre-wrap"
                style={showInvisible ? { 
                  background: 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #fafafa 10px, #fafafa 20px)'
                } : {}}
              >
                {output ? (
                  showInvisible ? (
                    output.split('').map((char, idx) => (
                      invisibleChars.some(ic => ic.char === char) ? 
                        <span key={idx} className="bg-red-200 border border-red-400 rounded px-0.5 mx-0.5" title="Invisible character">•</span> : 
                        char
                    ))
                  ) : output
                ) : "Generated invisible characters will appear here"}
              </div>
              <div className="text-xs text-gray-600 mt-1">Character count: {charCount}</div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={handleCopy} 
                className="win98-btn"
                disabled={!output}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                onClick={handleDownload} 
                className="win98-btn"
                disabled={!output}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={handleClear} 
                className="win98-btn"
                disabled={!input && !output}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="mt-4 text-xs border-t border-win98-btnshadow pt-4">
              <p className="font-bold mb-1">About Invisible Characters:</p>
              <p>Invisible characters are Unicode characters that take up space in text but don't visually appear. They're often used for formatting, in steganography, or to bypass character restrictions on websites.</p>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default InvisibleCharGenerator;

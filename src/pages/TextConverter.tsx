
import React, { useState, useEffect } from 'react';
import Win98Taskbar from '../components/Win98Taskbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { FileDown, Copy, Trash2, CaseLower, CaseUpper } from 'lucide-react';

const TextConverter = () => {
  const { toast } = useToast();
  const [text, setText] = useState<string>('');
  const [convertedText, setConvertedText] = useState<string>('');
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    sentences: 0,
    lines: 0
  });

  // Update statistics when text changes
  useEffect(() => {
    const characters = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length;
    const lines = text.trim() === '' ? 0 : text.split('\n').filter(Boolean).length;
    
    setStats({
      characters,
      words,
      sentences,
      lines
    });
  }, [text]);

  // Handle text conversion based on selected option
  const handleConversion = (conversionType: string) => {
    let result = '';
    
    switch (conversionType) {
      case 'sentenceCase':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'uppercase':
        result = text.toUpperCase();
        break;
      case 'capitalizedCase':
        result = text.replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'alternatingCase':
        result = text.split('').map((char, i) => 
          i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        ).join('');
        break;
      case 'titleCase':
        const minorWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of'];
        result = text.toLowerCase().replace(/\b\w+/g, (word, index) => {
          if (index === 0 || !minorWords.includes(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        });
        break;
      case 'inverseCase':
        result = text.split('').map(char => 
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        ).join('');
        break;
      default:
        result = text;
    }
    
    setConvertedText(result);
    toast({
      title: "Text Converted",
      description: `Text converted to ${conversionType}`,
    });
  };

  // Handle text download
  const handleDownload = () => {
    if (!convertedText) {
      toast({
        title: "No Text to Download",
        description: "Please convert some text first",
        variant: "destructive"
      });
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([convertedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'converted-text.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Download Started",
      description: "Your text file is being downloaded",
    });
  };

  // Handle clipboard copy
  const handleCopy = () => {
    if (!convertedText) {
      toast({
        title: "No Text to Copy",
        description: "Please convert some text first",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(convertedText).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Text has been copied to clipboard",
      });
    }).catch(err => {
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard",
        variant: "destructive"
      });
    });
  };

  // Handle clear text
  const handleClear = () => {
    setText('');
    setConvertedText('');
    toast({
      title: "Text Cleared",
      description: "Input and converted text have been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="font-ms-sans">Text Case Converter</div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-win98-btnface">
            {/* Text Input Area */}
            <div className="mb-4">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="[Type or paste your content here]"
                className="h-40 win98-input"
              />
            </div>
            
            {/* Case Conversion Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Button 
                onClick={() => handleConversion('sentenceCase')} 
                className="win98-btn"
                disabled={!text}
              >
                Sentence case
              </Button>
              <Button 
                onClick={() => handleConversion('lowercase')} 
                className="win98-btn"
                disabled={!text}
              >
                <CaseLower className="h-4 w-4" />
                <span>lower case</span>
              </Button>
              <Button 
                onClick={() => handleConversion('uppercase')} 
                className="win98-btn"
                disabled={!text}
              >
                <CaseUpper className="h-4 w-4" />
                <span>UPPER CASE</span>
              </Button>
              <Button 
                onClick={() => handleConversion('capitalizedCase')} 
                className="win98-btn"
                disabled={!text}
              >
                Capitalized Case
              </Button>
              <Button 
                onClick={() => handleConversion('alternatingCase')} 
                className="win98-btn"
                disabled={!text}
              >
                alTeRnAtInG cAsE
              </Button>
              <Button 
                onClick={() => handleConversion('titleCase')} 
                className="win98-btn"
                disabled={!text}
              >
                Title Case
              </Button>
              <Button 
                onClick={() => handleConversion('inverseCase')} 
                className="win98-btn"
                disabled={!text}
              >
                InVeRsE cAsE
              </Button>
            </div>
            
            {/* Converted Text Output */}
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Result:</div>
              <div className="win98-input h-40 overflow-y-auto p-2 whitespace-pre-wrap">
                {convertedText || "Converted text will appear here"}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                onClick={handleDownload} 
                className="win98-btn"
                disabled={!convertedText}
              >
                <FileDown className="h-4 w-4" />
                <span>Download Text</span>
              </Button>
              <Button 
                onClick={handleCopy} 
                className="win98-btn"
                disabled={!convertedText}
              >
                <Copy className="h-4 w-4" />
                <span>Copy to Clipboard</span>
              </Button>
              <Button 
                onClick={handleClear} 
                className="win98-btn"
                disabled={!text && !convertedText}
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            </div>
            
            {/* Text Statistics */}
            <div className="border border-win98-btnshadow p-2">
              <div className="text-sm font-bold mb-1">Text Statistics:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 text-sm">
                <div>Character Count: {stats.characters}</div>
                <div>Word Count: {stats.words}</div>
                <div>Sentence Count: {stats.sentences}</div>
                <div>Line Count: {stats.lines}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default TextConverter;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Download, Trash2 } from 'lucide-react';

const WordCombiner = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [list1, setList1] = useState<string>('');
  const [list2, setList2] = useState<string>('');
  const [separator, setSeparator] = useState<string>(' ');
  const [result, setResult] = useState<string>('');
  
  const handleBackClick = () => {
    navigate('/text-tools');
  };

  const combineWords = () => {
    if (!list1.trim() || !list2.trim()) {
      toast({
        title: "Missing Input",
        description: "Please provide words in both lists",
        variant: "destructive"
      });
      return;
    }

    const words1 = list1.split(/\s+/).filter(Boolean);
    const words2 = list2.split(/\s+/).filter(Boolean);
    
    const combinations: string[] = [];
    words1.forEach(word1 => {
      words2.forEach(word2 => {
        combinations.push(`${word1}${separator}${word2}`);
      });
    });
    
    setResult(combinations.join('\n'));
    toast({
      title: "Words Combined",
      description: `Created ${combinations.length} combinations`,
    });
  };

  const handleCopy = () => {
    if (!result) {
      toast({
        title: "Nothing to Copy",
        description: "Generate combinations first",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(result);
    toast({
      title: "Copied",
      description: "Combinations copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!result) {
      toast({
        title: "Nothing to Download",
        description: "Generate combinations first",
        variant: "destructive"
      });
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'word-combinations.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded",
      description: "Combinations saved to file",
    });
  };

  const handleClear = () => {
    setList1('');
    setList2('');
    setResult('');
    setSeparator(' ');
    toast({
      title: "Cleared",
      description: "All fields have been cleared",
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
              <div className="font-ms-sans">Word Combiner</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-win98-btnface">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-bold mb-1">List 1:</div>
                <Textarea 
                  value={list1}
                  onChange={(e) => setList1(e.target.value)}
                  placeholder="Enter words (one per line or space-separated)"
                  className="h-32 win98-input"
                />
              </div>
              <div>
                <div className="text-sm font-bold mb-1">List 2:</div>
                <Textarea 
                  value={list2}
                  onChange={(e) => setList2(e.target.value)}
                  placeholder="Enter words (one per line or space-separated)"
                  className="h-32 win98-input"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Separator:</div>
              <input 
                type="text" 
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="win98-input w-full"
                placeholder="Space, hyphen, etc."
              />
              <div className="text-xs text-gray-600 mt-1">Leave empty for no separator</div>
            </div>
            
            <div className="flex justify-center mb-4">
              <Button 
                onClick={combineWords} 
                className="win98-btn"
              >
                Combine Words
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Results:</div>
              <div className="win98-input min-h-[100px] max-h-[300px] p-2 bg-white overflow-y-auto whitespace-pre-wrap">
                {result || "Combined words will appear here"}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={handleCopy} 
                className="win98-btn"
                disabled={!result}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                onClick={handleDownload} 
                className="win98-btn"
                disabled={!result}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={handleClear} 
                className="win98-btn"
                disabled={!list1 && !list2 && !result}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default WordCombiner;

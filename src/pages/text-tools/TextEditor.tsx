
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

const TextEditor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [formattedContent, setFormattedContent] = useState<string>('');
  
  const handleBackClick = () => {
    navigate('/text-tools');
  };

  const applyFormat = (format: string) => {
    // Simulate text formatting
    switch (format) {
      case 'bold':
        setFormattedContent(`<b>${content}</b>`);
        break;
      case 'italic':
        setFormattedContent(`<i>${content}</i>`);
        break;
      case 'underline':
        setFormattedContent(`<u>${content}</u>`);
        break;
      case 'align-left':
        setFormattedContent(`<div style="text-align: left">${content}</div>`);
        break;
      case 'align-center':
        setFormattedContent(`<div style="text-align: center">${content}</div>`);
        break;
      case 'align-right':
        setFormattedContent(`<div style="text-align: right">${content}</div>`);
        break;
      case 'align-justify':
        setFormattedContent(`<div style="text-align: justify">${content}</div>`);
        break;
      default:
        setFormattedContent(content);
    }
    
    toast({
      title: "Format Applied",
      description: `Applied ${format} formatting to text`,
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
              <div className="font-ms-sans">Text Editor</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-win98-btnface">
            {/* Formatting toolbar */}
            <div className="mb-4 flex flex-wrap gap-2 border border-win98-btnshadow p-2">
              <Button className="win98-btn" onClick={() => applyFormat('bold')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button className="win98-btn" onClick={() => applyFormat('italic')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button className="win98-btn" onClick={() => applyFormat('underline')}>
                <Underline className="h-4 w-4" />
              </Button>
              <div className="border-r border-win98-btnshadow mx-2"></div>
              <Button className="win98-btn" onClick={() => applyFormat('align-left')}>
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button className="win98-btn" onClick={() => applyFormat('align-center')}>
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button className="win98-btn" onClick={() => applyFormat('align-right')}>
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button className="win98-btn" onClick={() => applyFormat('align-justify')}>
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Text input area */}
            <div className="mb-4">
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your text here..."
                className="h-40 win98-input"
              />
            </div>
            
            {/* Text output with formatting */}
            <div className="mb-4">
              <div className="text-sm font-bold mb-1">Formatted Output:</div>
              <div 
                className="win98-input min-h-[100px] p-2 bg-white overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: formattedContent || "Your formatted text will appear here" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default TextEditor;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";

const TextTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  
  // Define text tools
  const textTools = [
    { id: 'text-converter', label: 'Text Case Converter', icon: 'Aa' },
    { id: 'text-editor', label: 'Text Editor', icon: '📝' },
    { id: 'word-combiner', label: 'Word Combiner', icon: '🔡' },
    { id: 'md5-generator', label: 'MD5 Generator', icon: '🔒' },
    { id: 'invisible-char-generator', label: 'Invisible Character Generator', icon: '👻' },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('textToolsIconPositions');
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      textTools.forEach((tool, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 100), 
          y: 20 + (row * 100) 
        };
      });
      setIconPositions(defaultPositions);
      localStorage.setItem('textToolsIconPositions', JSON.stringify(defaultPositions));
    }
  }, []);
  
  // Handle icon position change
  const handlePositionChange = (id: string, position: { x: number, y: number }) => {
    const newPositions = { ...iconPositions, [id]: position };
    setIconPositions(newPositions);
    localStorage.setItem('textToolsIconPositions', JSON.stringify(newPositions));
  };

  const handleIconClick = (id: string) => {
    navigate(`/text-tools/${id}`);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-4xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">Text Tools</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-white min-h-[400px] relative">
            {textTools.map((tool) => (
              <Win98DesktopIcon
                key={tool.id}
                id={tool.id}
                icon={<span className="text-2xl">{tool.icon}</span>}
                label={tool.label}
                position={iconPositions[tool.id]}
                onPositionChange={handlePositionChange}
                onClick={() => handleIconClick(tool.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default TextTools;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";

const TextTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const textTools = [
    { id: 'text-converter', label: 'Text Case Converter', icon: 'Aa' },
    { id: 'text-editor', label: 'Text Editor', icon: '📝' },
    { id: 'word-combiner', label: 'Word Combiner', icon: '🔡' },
    { id: 'md5-generator', label: 'MD5 Generator', icon: '🔒' },
    { id: 'invisible-char-generator', label: 'Invisible Character Generator', icon: '👻' },
  ];

  const handleIconClick = (id: string) => {
    navigate(`/text-tools/${id}`);
  };

  const handleBackClick = () => {
    navigate('/');
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
              <div className="font-ms-sans">Text Tools</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <div className="p-4 bg-white min-h-[400px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {textTools.map((tool) => (
                <Win98DesktopIcon
                  key={tool.id}
                  icon={<span className="text-2xl">{tool.icon}</span>}
                  label={tool.label}
                  onClick={() => handleIconClick(tool.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default TextTools;

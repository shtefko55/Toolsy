
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";

const PDFTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  
  // Define PDF tools
  const pdfTools = [
    { id: 'merge-pdf', label: 'Merge PDF', icon: '🔗' },
    { id: 'split-pdf', label: 'Split PDF', icon: '✂️' },
    { id: 'word-to-pdf', label: 'Word to PDF', icon: '📝' },
    { id: 'powerpoint-to-pdf', label: 'PowerPoint to PDF', icon: '📊' },
    { id: 'excel-to-pdf', label: 'Excel to PDF', icon: '📈' },
    { id: 'pdf-to-jpg', label: 'PDF to JPG', icon: '🖼️' },
    { id: 'jpg-to-pdf', label: 'JPG to PDF', icon: '📷' },
    { id: 'rotate-pdf', label: 'Rotate PDF', icon: '🔄' },
    { id: 'compress-pdf', label: 'Compress PDF', icon: '🗜️' },
    { id: 'edit-pdf', label: 'Edit PDF', icon: '✏️' },
    { id: 'pdf-to-word', label: 'PDF to Word', icon: '📄' },
    { id: 'pdf-to-powerpoint', label: 'PDF to PowerPoint', icon: '📑' },
    { id: 'pdf-to-excel', label: 'PDF to Excel', icon: '📋' },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('pdfToolsIconPositions');
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      pdfTools.forEach((tool, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 120), 
          y: 20 + (row * 100) 
        };
      });
      setIconPositions(defaultPositions);
      localStorage.setItem('pdfToolsIconPositions', JSON.stringify(defaultPositions));
    }
  }, []);
  
  // Handle icon position change
  const handlePositionChange = (id: string, position: { x: number, y: number }) => {
    const newPositions = { ...iconPositions, [id]: position };
    setIconPositions(newPositions);
    localStorage.setItem('pdfToolsIconPositions', JSON.stringify(newPositions));
  };

  const handleIconClick = (id: string) => {
    navigate(`/pdf-tools/${id}`);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-6xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">PDF Tools ❤️</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button 
                onClick={handleBackClick} 
                className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-4 bg-white min-h-[500px] relative">
            {pdfTools.map((tool) => (
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

export default PDFTools;

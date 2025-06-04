
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";
import { Grid, List } from 'lucide-react';

const PDFTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
    const savedViewMode = localStorage.getItem('pdfToolsViewMode') as 'grid' | 'list' || 'grid';
    setViewMode(savedViewMode);
    
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
    // Check if tool has a route, otherwise show coming soon message
    const toolsWithRoutes = ['merge-pdf', 'split-pdf', 'word-to-pdf'];
    
    if (toolsWithRoutes.includes(id)) {
      navigate(`/pdf-tools/${id}`);
    } else {
      toast({
        title: "Coming Soon!",
        description: `${pdfTools.find(tool => tool.id === id)?.label} tool is coming soon!`,
      });
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('pdfToolsViewMode', newMode);
  };

  const renderGridView = () => (
    <>
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
    </>
  );

  const renderListView = () => (
    <div className="p-4">
      <div className="bg-white border border-gray-300 rounded">
        <div className="bg-gray-100 border-b border-gray-300 p-2 font-bold text-sm">
          <div className="flex">
            <div className="flex-1">Name</div>
            <div className="w-20">Type</div>
          </div>
        </div>
        {pdfTools.map((tool, index) => (
          <div 
            key={tool.id}
            className={`flex items-center p-2 cursor-pointer hover:bg-blue-100 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            onClick={() => handleIconClick(tool.id)}
          >
            <span className="mr-3 text-lg">{tool.icon}</span>
            <div className="flex-1 text-black text-sm">{tool.label}</div>
            <div className="w-20 text-gray-600 text-xs">PDF Tool</div>
          </div>
        ))}
      </div>
    </div>
  );

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
          
          {/* Toolbar */}
          <div className="bg-win98-gray border-b border-win98-btnshadow p-2 flex items-center gap-2">
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'grid' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <Grid className="h-3 w-3" />
              Grid
            </button>
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'list' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <List className="h-3 w-3" />
              List
            </button>
          </div>

          <div className={`bg-white min-h-[500px] ${viewMode === 'grid' ? 'relative' : ''}`}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PDFTools;

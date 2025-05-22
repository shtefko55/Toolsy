
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98SearchBar from '../components/Win98SearchBar';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchBarPosition, setSearchBarPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      toast({
        title: "Search Error",
        description: "Please enter a search query",
      });
      return;
    }

    // Check if query matches known applications
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('text') && 
        (lowerQuery.includes('convert') || lowerQuery.includes('case') || 
         lowerQuery.includes('notepad') || lowerQuery.includes('word'))) {
      navigate('/text-tools/text-converter');
      return;
    }

    toast({
      title: "Search Results",
      description: `You searched for: ${query}`,
    });
    setSearchResults(query);
  };

  const desktopIcons = [
    { id: 'mycomputer', label: 'My Computer', icon: '🖥️' },
    { id: 'recyclebin', label: 'Recycle Bin', icon: '🗑️' },
    { id: 'texttools', label: 'Text Tools', icon: '📁' },
    { id: 'msdos', label: 'MS-DOS', icon: '📝' },
    { id: 'explorer', label: 'Internet Explorer', icon: '🌐' },
    { id: 'texttoolsicon', label: 'Text Case Convert', icon: 'Aa' },
  ];

  const handleIconClick = (id: string) => {
    if (id === 'texttoolsicon' || id === 'texttools') {
      navigate('/text-tools/text-converter');
    } else {
      toast({
        title: "Icon Clicked",
        description: `You clicked on: ${id}`,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: searchBarPosition.x,
      startPosY: searchBarPosition.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setSearchBarPosition({
      x: dragRef.current.startPosX + deltaX,
      y: dragRef.current.startPosY + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        setSearchBarPosition({
          x: dragRef.current.startPosX + deltaX,
          y: dragRef.current.startPosY + deltaY
        });
      }
    };

    // Add global event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      // Remove global event listeners on cleanup
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      {/* Desktop */}
      <div className="flex-grow p-4">
        {/* Desktop Icons */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {desktopIcons.map((icon) => (
            <Win98DesktopIcon
              key={icon.id}
              icon={<span className="text-2xl">{icon.icon}</span>}
              label={icon.label}
              onClick={() => handleIconClick(icon.id)}
            />
          ))}
        </div>

        {/* Draggable Search Bar */}
        <div 
          className="absolute"
          style={{ 
            left: `${searchBarPosition.x}px`, 
            top: `${searchBarPosition.y}px`,
            transform: 'none'
          }}
        >
          <div 
            className="win98-window-title cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="text-sm font-ms-sans">Search</div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
            </div>
          </div>
          <Win98SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Taskbar */}
      <Win98Taskbar />
    </div>
  );
};

export default Index;

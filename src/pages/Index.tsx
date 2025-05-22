
import React, { useState } from 'react';
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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setSearchBarPosition({
        x: e.clientX - 250, // Center the search bar on the cursor horizontally
        y: e.clientY - 25  // Adjust vertical position to keep cursor on the title bar
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse events when component mounts
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden" 
         onMouseMove={isDragging ? handleMouseMove : undefined}
         onMouseUp={isDragging ? handleMouseUp : undefined}>
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
            left: `calc(50% + ${searchBarPosition.x}px)`, 
            top: `calc(50% + ${searchBarPosition.y}px)`,
            transform: 'translate(-50%, -50%)'
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

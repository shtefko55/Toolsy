
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
      navigate('/text-converter');
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
    { id: 'myfiles', label: 'My Files', icon: '📁' },
    { id: 'msdos', label: 'MS-DOS', icon: '📝' },
    { id: 'explorer', label: 'Internet Explorer', icon: '🌐' },
    { id: 'texttools', label: 'Text Tools', icon: 'Aa' },
  ];

  const handleIconClick = (id: string) => {
    if (id === 'texttools') {
      navigate('/text-converter');
    } else {
      toast({
        title: "Icon Clicked",
        description: `You clicked on: ${id}`,
      });
    }
  };

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

        {/* Search Bar */}
        <div className="flex justify-center items-center h-full -mt-20">
          <Win98SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Taskbar */}
      <Win98Taskbar />
    </div>
  );
};

export default Index;

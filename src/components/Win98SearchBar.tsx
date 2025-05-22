
import React, { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

interface Win98SearchBarProps {
  onSearch: (query: string) => void;
}

interface SearchSuggestion {
  id: string;
  label: string;
  path: string;
  keywords: string[];
}

const searchSuggestions: SearchSuggestion[] = [
  { 
    id: 'text-converter', 
    label: 'Text Case Converter', 
    path: '/text-converter', 
    keywords: ['text', 'case', 'converter', 'uppercase', 'lowercase', 'sentence']
  },
  { 
    id: 'notepad', 
    label: 'Notepad', 
    path: '/text-converter', 
    keywords: ['notepad', 'text', 'editor', 'note']
  },
  { 
    id: 'wordpad', 
    label: 'WordPad', 
    path: '/text-converter', 
    keywords: ['wordpad', 'text', 'document', 'word']
  },
];

const Win98SearchBar: React.FC<Win98SearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const navigate = useNavigate();
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = searchSuggestions.filter(suggestion => {
      return suggestion.label.toLowerCase().includes(query) || 
             suggestion.keywords.some(keyword => keyword.toLowerCase().includes(query));
    });
    
    setFilteredSuggestions(filtered);
  }, [searchQuery]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredSuggestions.length > 0) {
        // Navigate to the first suggestion
        handleSelectSuggestion(filteredSuggestions[0]);
      } else {
        onSearch(searchQuery);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);
    navigate(suggestion.path);
    onSearch(suggestion.label);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="win98-window max-w-md w-full" ref={searchBarRef}>
      <div className="win98-window-title">
        <div className="text-sm font-ms-sans">Search</div>
        <div className="flex gap-1">
          <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
          <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
          <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">×</button>
        </div>
      </div>
      <div className="p-4 bg-win98-btnface">
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <input
              type="text"
              className="win98-input w-full"
              placeholder="Search the web..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full z-10 mt-1 bg-win98-btnface border border-win98-btnshadow">
                {filteredSuggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className="px-3 py-2 hover:bg-win98-highlight hover:text-white cursor-pointer"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            className="win98-btn flex items-center gap-2"
            onClick={() => {
              if (filteredSuggestions.length > 0) {
                handleSelectSuggestion(filteredSuggestions[0]);
              } else {
                onSearch(searchQuery);
              }
            }}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Win98SearchBar;

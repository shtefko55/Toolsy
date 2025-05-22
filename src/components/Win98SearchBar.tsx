
import React, { useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

interface Win98SearchBarProps {
  onSearch: (query: string) => void;
}

const Win98SearchBar: React.FC<Win98SearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="win98-window max-w-md w-full">
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
          <input
            type="text"
            className="win98-input w-full"
            placeholder="Search the web..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="win98-btn flex items-center gap-2"
            onClick={() => onSearch(searchQuery)}
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

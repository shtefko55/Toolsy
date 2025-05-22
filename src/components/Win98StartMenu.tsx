
import React, { useState } from 'react';
import { Search, FileText, Type, TextCursor } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface StartMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
}

interface StartMenuSection {
  title: string;
  items: StartMenuItem[];
}

interface Win98StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: StartMenuItem[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
  { id: 'help', label: 'Help' },
  { id: 'run', label: 'Run...' },
  { id: 'shutdown', label: 'Shut Down...' },
];

const textTools: StartMenuSection = {
  title: "Text Processing Tools",
  items: [
    { id: 'notepad', label: 'Notepad', icon: <FileText className="h-4 w-4" />, path: '/text-converter' },
    { id: 'wordpad', label: 'WordPad', icon: <TextCursor className="h-4 w-4" />, path: '/text-converter' },
    { id: 'wordprocessor', label: 'Word Processor', icon: <Type className="h-4 w-4" />, path: '/text-converter' },
  ]
};

const Win98StartMenu: React.FC<Win98StartMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleItemClick = (item: StartMenuItem) => {
    if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  return (
    <div className="win98-start-menu" onClick={(e) => e.stopPropagation()}>
      <div className="bg-win98-blue h-full w-10 absolute top-0 bottom-0 left-0 flex flex-col justify-end">
        <div className="text-white font-ms-sans font-bold transform -rotate-90 mb-8 origin-bottom-left ml-2">
          Windows 98
        </div>
      </div>
      
      <div className="pl-12 py-1">
        {/* Text Processing Tools Section */}
        <div className="mb-2">
          <div className="text-sm font-bold px-2 py-1">{textTools.title}</div>
          {textTools.items.map(item => (
            <div 
              key={item.id} 
              className="win98-start-menu-item"
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        
        {/* Separator */}
        <div className="border-t border-win98-shadow my-1"></div>
        
        {/* Regular Menu Items */}
        {menuItems.map(item => (
          <div 
            key={item.id} 
            className="win98-start-menu-item"
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Win98StartMenu;

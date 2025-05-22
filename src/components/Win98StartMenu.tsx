
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface StartMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface Win98StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: StartMenuItem[] = [
  { id: 'programs', label: 'Programs' },
  { id: 'documents', label: 'Documents' },
  { id: 'settings', label: 'Settings' },
  { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
  { id: 'help', label: 'Help' },
  { id: 'run', label: 'Run...' },
  { id: 'shutdown', label: 'Shut Down...' },
];

const Win98StartMenu: React.FC<Win98StartMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="win98-start-menu" onClick={(e) => e.stopPropagation()}>
      <div className="bg-win98-blue h-full w-10 absolute top-0 bottom-0 left-0 flex flex-col justify-end">
        <div className="text-white font-ms-sans font-bold transform -rotate-90 mb-8 origin-bottom-left ml-2">
          Windows 98
        </div>
      </div>
      <div className="pl-12 py-1">
        {menuItems.map(item => (
          <div key={item.id} className="win98-start-menu-item">
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Win98StartMenu;

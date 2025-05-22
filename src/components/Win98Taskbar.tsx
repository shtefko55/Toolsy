
import React, { useState } from 'react';
import Win98StartMenu from './Win98StartMenu';

interface Win98TaskbarProps {
  time?: string;
}

const Win98Taskbar: React.FC<Win98TaskbarProps> = ({ time }) => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const closeStartMenu = () => {
    if (startMenuOpen) {
      setStartMenuOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', closeStartMenu);

    return () => {
      document.removeEventListener('click', closeStartMenu);
    };
  }, [startMenuOpen]);

  return (
    <div className="win98-taskbar h-10 flex justify-between items-center px-1 py-1">
      <div className="relative">
        <button
          className={`win98-start-btn ${startMenuOpen ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleStartMenu();
          }}
        >
          <img src="/favicon.ico" alt="Windows" className="w-4 h-4" />
          <span>Start</span>
        </button>
        <Win98StartMenu isOpen={startMenuOpen} onClose={() => setStartMenuOpen(false)} />
      </div>

      <div className="border border-win98-btnshadow bg-win98-btnface px-2 py-0.5 text-sm">
        {time || currentTime}
      </div>
    </div>
  );
};

export default Win98Taskbar;

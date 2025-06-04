import React, { useState, useRef, useEffect } from 'react';

interface Win98DesktopIconProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  position?: { x: number, y: number };
  onPositionChange?: (id: string, position: { x: number, y: number }) => void;
  onClick?: () => void;
}

const Win98DesktopIcon: React.FC<Win98DesktopIconProps> = ({ 
  id, 
  icon, 
  label, 
  position, 
  onPositionChange, 
  onClick 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const dragRef = useRef<{ 
    startX: number; 
    startY: number; 
    startPosX: number; 
    startPosY: number 
  }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent text selection during drag
    e.preventDefault();
    e.stopPropagation();
    
    setHasMovedDuringDrag(false);
    setIsSelected(true);
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position?.x || 0,
      startPosY: position?.y || 0
    };
  };

  useEffect(() => {
    // Create a style element to disable text selection while dragging
    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Detect if the icon has moved during drag
        const deltaX = Math.abs(e.clientX - dragRef.current.startX);
        const deltaY = Math.abs(e.clientY - dragRef.current.startY);
        
        // Consider as moved if dragged more than 3 pixels in any direction
        if (deltaX > 3 || deltaY > 3) {
          setHasMovedDuringDrag(true);
        }
        
        // Disable text selection during dragging
        styleElement.innerHTML = '* { user-select: none !important; }';
        
        const deltaX2 = e.clientX - dragRef.current.startX;
        const deltaY2 = e.clientY - dragRef.current.startY;
        
        const newX = dragRef.current.startPosX + deltaX2;
        const newY = dragRef.current.startPosY + deltaY2;
        
        if (onPositionChange) {
          onPositionChange(id, { x: newX, y: newY });
        }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        if (!hasMovedDuringDrag && onClick) {
          // Only trigger click if the icon wasn't dragged
          onClick();
        }
        
        setIsDragging(false);
        // Re-enable text selection when dragging stops
        styleElement.innerHTML = '';
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(`[data-icon-id="${id}"]`)) {
        setIsSelected(false);
      }
    };

    // Add global event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('click', handleGlobalClick);

    return () => {
      // Remove global event listeners on cleanup
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('click', handleGlobalClick);
      document.head.removeChild(styleElement);
    };
  }, [isDragging, onPositionChange, id, onClick, hasMovedDuringDrag]);

  return (
    <div 
      data-icon-id={id}
      className={`win98-desktop-icon absolute cursor-move ${isDragging ? 'z-10' : ''}`}
      style={{ 
        left: `${position?.x || 20}px`, 
        top: `${position?.y || 20}px` 
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`${isSelected ? 'bg-win98-highlight' : ''} p-1 rounded`}>
        <div className="flex flex-col items-center">
          <div>{icon}</div>
          <div className={`text-xs text-center font-ms-sans px-1 py-0.5 max-w-16 break-words ${
            isSelected 
              ? 'text-white bg-win98-highlight' 
              : 'text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]'
          } rounded`}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Win98DesktopIcon;

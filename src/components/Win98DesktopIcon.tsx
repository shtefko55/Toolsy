
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

    // Add global event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      // Remove global event listeners on cleanup
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.head.removeChild(styleElement);
    };
  }, [isDragging, onPositionChange, id, onClick, hasMovedDuringDrag]);

  return (
    <div 
      className={`win98-desktop-icon absolute cursor-move ${isDragging ? 'z-10' : ''}`}
      style={{ 
        left: `${position?.x || 20}px`, 
        top: `${position?.y || 20}px` 
      }}
      onMouseDown={handleMouseDown}
    >
      <div>{icon}</div>
      <div className="text-white text-xs text-center font-ms-sans">{label}</div>
    </div>
  );
};

export default Win98DesktopIcon;

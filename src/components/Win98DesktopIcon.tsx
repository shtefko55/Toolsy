
import React from 'react';

interface Win98DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const Win98DesktopIcon: React.FC<Win98DesktopIconProps> = ({ icon, label, onClick }) => {
  return (
    <div className="win98-desktop-icon" onClick={onClick}>
      <div>{icon}</div>
      <div className="text-white text-xs text-center font-ms-sans">{label}</div>
    </div>
  );
};

export default Win98DesktopIcon;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';

const ImageToolsSimple = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs" 
                onClick={() => navigate('/')}
              >
                ← Back
              </button>
              <div className="font-ms-sans">🖼️ Image Tools</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button 
                onClick={() => navigate('/')} 
                className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Image Tools Suite</h2>
            <p className="mb-4">Welcome to the Image Tools! This is a simplified test version.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">🗜️</div>
                <div className="text-sm">Image Compressor</div>
              </div>
              
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">📏</div>
                <div className="text-sm">Image Resizer</div>
              </div>
              
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm">Format Converter</div>
              </div>
              
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm">Color Picker</div>
              </div>
              
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm">Image Editor</div>
              </div>
              
              <div className="win98-btn p-4 text-center">
                <div className="text-2xl mb-2">➕</div>
                <div className="text-sm">More Tools</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default ImageToolsSimple; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";
import { Grid, List, Image } from 'lucide-react';

const ImageTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Define Image tools - Comprehensive Suite (50+ tools)
  const imageTools = [
    // Core Processing Tools
    { id: 'image-compressor', label: 'Image Compressor', icon: '🗜️', category: 'Optimization', description: 'Reduce file size using canvas and quality adjustment' },
    { id: 'image-cropper', label: 'Image Cropper', icon: '✂️', category: 'Editing', description: 'Drag to crop and export selected region' },
    { id: 'image-resizer', label: 'Image Resizer', icon: '📏', category: 'Transform', description: 'Resize by pixels or percentage' },
    { id: 'image-converter', label: 'Image Format Converter', icon: '🔄', category: 'Conversion', description: 'Convert between JPEG, PNG, WebP, BMP' },
    { id: 'image-rotator', label: 'Image Rotator/Flipper', icon: '🔄', category: 'Transform', description: 'Rotate (90° steps) or flip (horizontal/vertical)' },
    
    // Upload & Preview
    { id: 'image-preview', label: 'Image Preview & Upload', icon: '📤', category: 'Upload', description: 'Client-side preview with drag & drop validation' },
    { id: 'image-editor', label: 'Basic Image Editor', icon: '🎨', category: 'Editing', description: 'Canvas-based brightness/contrast adjustments' },
    { id: 'watermark-tool', label: 'Watermark Tool', icon: '🏷️', category: 'Effects', description: 'Add text or logo to images with opacity controls' },
    { id: 'image-filters', label: 'Image Filter Effects', icon: '🌈', category: 'Effects', description: 'Instagram-style filters using canvas (sepia, grayscale, etc.)' },
    { id: 'base64-converter', label: 'Image to Base64', icon: '📝', category: 'Conversion', description: 'Convert to/from Base64 strings' },
    
    // Advanced Processing
    { id: 'screenshot-capture', label: 'Screenshot Capture', icon: '📸', category: 'Capture', description: 'Capture HTML sections with html2canvas' },
    { id: 'collage-maker', label: 'Image Collage Maker', icon: '🖼️', category: 'Creative', description: 'Arrange multiple images in grid layout' },
    { id: 'photo-booth', label: 'Web Photo Booth', icon: '📷', category: 'Capture', description: 'Take snapshots using webcam getUserMedia()' },
    { id: 'exif-viewer', label: 'EXIF Metadata Viewer', icon: '📊', category: 'Analysis', description: 'Display camera info from uploaded photo' },
    { id: 'photo-frame', label: 'Photo Frame Generator', icon: '🖼️', category: 'Effects', description: 'Add decorative borders to images' },
    
    // Creative Tools
    { id: 'pixel-art', label: 'Pixel Art Creator', icon: '🎨', category: 'Creative', description: 'Draw pixelated images on a grid canvas' },
    { id: 'color-picker', label: 'Color Picker from Image', icon: '🎨', category: 'Analysis', description: 'Click to get color hex from uploaded image' },
    { id: 'image-annotator', label: 'Image Annotator', icon: '✏️', category: 'Editing', description: 'Draw arrows, shapes, and text over an image' },
    { id: 'image-splitter', label: 'Image Splitter', icon: '✂️', category: 'Transform', description: 'Slice image into grid of smaller pieces' },
    { id: 'image-merge', label: 'Image Merge Tool', icon: '🔗', category: 'Composition', description: 'Combine two or more images into one' },
    
    // Web Tools
    { id: 'slider-builder', label: 'Image Slider Builder', icon: '🎚️', category: 'Web', description: 'Drag-drop image list → export slider code' },
    { id: 'meme-generator', label: 'Meme Generator', icon: '😂', category: 'Creative', description: 'Add top/bottom text on images with draggable text boxes' },
    { id: 'gif-creator', label: 'Animated GIF Creator', icon: '🎬', category: 'Animation', description: 'Merge images to animated GIF using JS' },
    { id: 'comparison-slider', label: 'Photo Comparison Slider', icon: '⚖️', category: 'Web', description: 'Side-by-side before/after with draggable slider' },
    { id: 'blur-sharpen', label: 'Image Blur/Sharpen', icon: '🔍', category: 'Effects', description: 'Apply convolution kernels on canvas' },
    
    // Filter Effects
    { id: 'noise-generator', label: 'Image Noise Generator', icon: '📻', category: 'Effects', description: 'Add film-style noise/grain to image' },
    { id: 'posterizer', label: 'Posterizer/Color Reducer', icon: '🎨', category: 'Effects', description: 'Reduce number of colors (e.g., to 8, 16)' },
    { id: 'image-overlay', label: 'Image Overlay Tool', icon: '📐', category: 'Composition', description: 'Stack two images with blend modes' },
    { id: 'progressive-loader', label: 'Progressive Image Loader', icon: '⏳', category: 'Optimization', description: 'Load low-res first, then full-res image' },
    { id: 'photo-grid', label: 'Photo Grid Generator', icon: '⚏', category: 'Layout', description: 'Upload multiple images and generate grid layout' },
    
    // Utility Tools
    { id: 'favicon-generator', label: 'Favicon Generator', icon: '🌐', category: 'Web', description: 'Create favicon.ico and PNG in various sizes' },
    { id: 'thumbnail-maker', label: 'Online Thumbnail Maker', icon: '📱', category: 'Web', description: 'Create preview images for YouTube/blogs' },
    { id: 'color-inverter', label: 'Color Inverter', icon: '🔄', category: 'Effects', description: 'Invert all image colors for "negative" effect' },
    { id: 'multi-size-export', label: 'Multi-size Exporter', icon: '📦', category: 'Export', description: 'Upload once, export in different resolutions' },
    { id: 'circular-cropper', label: 'Circular Cropper/Avatar', icon: '⭕', category: 'Transform', description: 'Crop image into a circle and export' },
    
    // Advanced Creative
    { id: 'sprite-sheet', label: 'Sprite Sheet Generator', icon: '🎮', category: 'Gaming', description: 'Combine frames into sprite sheet for games' },
    { id: 'low-poly', label: 'Low Poly Image Generator', icon: '🔺', category: 'Artistic', description: 'Pixelate image into triangle-based pattern' },
    { id: 'qr-with-logo', label: 'QR Code with Logo', icon: '📱', category: 'Utility', description: 'Insert logo into QR code (uses only JS)' },
    { id: 'tiny-planet', label: 'Tiny Planet Filter', icon: '🌍', category: 'Artistic', description: 'Wrap panoramic image into circle' },
    { id: 'puzzle-generator', label: 'Image Puzzle Generator', icon: '🧩', category: 'Games', description: 'Turn uploaded image into a sliding puzzle' },
    
    // Webcam & Interactive
    { id: 'webcam-overlay', label: 'Webcam + Image Overlay', icon: '📹', category: 'Interactive', description: 'Combine webcam feed with image (masks/stickers)' },
    { id: 'layer-editor', label: 'Canvas Drawing with Layers', icon: '🎨', category: 'Editing', description: 'Basic Photoshop-style layers system' },
    { id: 'image-diff', label: 'Image Diff Tool', icon: '🔍', category: 'Analysis', description: 'Compare two images pixel-by-pixel, highlight differences' },
    { id: 'noise-remover', label: 'Noise Remover', icon: '🧹', category: 'Restoration', description: 'Remove salt-and-pepper noise with algorithm' },
    { id: 'svg-converter', label: 'SVG to PNG Converter', icon: '🔄', category: 'Conversion', description: 'Render and export SVG as raster' },
    
    // Analysis Tools
    { id: 'histogram-viewer', label: 'Image Histogram Viewer', icon: '📊', category: 'Analysis', description: 'Show RGB histograms from image' },
    { id: 'halftone-filter', label: 'Halftone Filter', icon: '📰', category: 'Artistic', description: 'Convert to dotted newspaper style' },
    { id: 'color-palette', label: 'Color Palette Extractor', icon: '🎨', category: 'Analysis', description: 'Get top 5–10 dominant colors' },
    { id: 'ascii-art', label: 'ASCII Art Generator', icon: '📝', category: 'Artistic', description: 'Map image brightness to ASCII characters' },
    { id: 'chroma-key', label: 'Green Screen/Chroma Key', icon: '🎬', category: 'Effects', description: 'Remove a chosen background color' },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('imageToolsIconPositions');
    const savedViewMode = localStorage.getItem('imageToolsViewMode') as 'grid' | 'list' || 'grid';
    setViewMode(savedViewMode);
    
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      imageTools.forEach((tool, index) => {
        const row = Math.floor(index / 6); // 6 icons per row
        const col = index % 6;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 120), // Horizontal spacing
          y: 20 + (row * 100)  // Vertical spacing
        };
      });
      setIconPositions(defaultPositions);
      localStorage.setItem('imageToolsIconPositions', JSON.stringify(defaultPositions));
    }
  }, []);
  
  // Handle icon position change
  const handlePositionChange = (id: string, position: { x: number, y: number }) => {
    const newPositions = { ...iconPositions, [id]: position };
    setIconPositions(newPositions);
    localStorage.setItem('imageToolsIconPositions', JSON.stringify(newPositions));
  };

  const handleIconClick = (id: string) => {
    // Define which tools have working implementations
    const toolsWithRoutes = [
      'image-compressor', 'image-resizer', 'image-converter', 
      'image-editor', 'color-picker'
    ];
    
    if (toolsWithRoutes.includes(id)) {
      navigate(`/image-tools/${id}`);
    } else {
      toast({
        title: "Coming Soon! 🖼️",
        description: `${imageTools.find(tool => tool.id === id)?.label} tool is coming soon!`,
      });
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('imageToolsViewMode', newMode);
  };

  const renderGridView = () => (
    <>
      {imageTools.map((tool) => (
        <Win98DesktopIcon
          key={tool.id}
          id={tool.id}
          icon={<span className="text-2xl">{tool.icon}</span>}
          label={tool.label}
          position={iconPositions[tool.id]}
          onPositionChange={handlePositionChange}
          onClick={() => handleIconClick(tool.id)}
          variant="window"
        />
      ))}
    </>
  );

  const renderListView = () => {
    const groupedTools = imageTools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, typeof imageTools>);

    return (
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-4">
            <div className="bg-gray-200 border border-gray-300 p-2 font-bold text-sm text-black rounded-t flex items-center">
              <Image className="h-4 w-4 mr-2" />
              {category} Tools ({tools.length})
            </div>
            <div className="bg-white border border-gray-300 rounded-b">
              {tools.map((tool, index) => (
                <div 
                  key={tool.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-blue-100 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleIconClick(tool.id)}
                >
                  <span className="mr-3 text-lg">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="text-black text-sm font-medium">{tool.label}</div>
                    <div className="text-gray-600 text-xs">{tool.description}</div>
                  </div>
                  <div className="w-20 text-gray-600 text-xs">{tool.category}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-6xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">🖼️ Image Tools</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button 
                onClick={handleBackClick} 
                className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="bg-win98-gray border-b border-win98-btnshadow p-2 flex items-center gap-2">
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'grid' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <Grid className="h-3 w-3" />
              Grid
            </button>
            <button 
              className={`win98-btn px-2 py-1 flex items-center gap-1 ${viewMode === 'list' ? 'shadow-win98-in' : ''}`}
              onClick={toggleViewMode}
            >
              <List className="h-3 w-3" />
              List
            </button>
            <div className="ml-auto text-xs text-gray-600">
              {imageTools.length} Image Tools Available
            </div>
          </div>

          <div className={`bg-white min-h-[600px] ${viewMode === 'grid' ? 'relative overflow-auto' : ''}`}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-600 flex items-center">
            <span>🖼️ Image Tools Suite - Professional image processing and creative tools</span>
            <div className="ml-auto flex items-center gap-4">
              <span>Tools: {imageTools.length}</span>
              <span>Categories: {new Set(imageTools.map(t => t.category)).size}</span>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default ImageTools; 
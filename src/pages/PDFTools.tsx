
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";
import { Grid, List } from 'lucide-react';

const PDFTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Define PDF tools - Comprehensive suite
  const pdfTools = [
    // Existing tools
    { id: 'merge-pdf', label: 'Merge PDF', icon: '🔗', category: 'Basic' },
    { id: 'split-pdf', label: 'Split PDF', icon: '✂️', category: 'Basic' },
    { id: 'word-to-pdf', label: 'Word to PDF', icon: '📝', category: 'Conversion' },
    { id: 'powerpoint-to-pdf', label: 'PowerPoint to PDF', icon: '📊', category: 'Conversion' },
    { id: 'excel-to-pdf', label: 'Excel to PDF', icon: '📈', category: 'Conversion' },
    { id: 'pdf-to-jpg', label: 'PDF to JPG', icon: '🖼️', category: 'Conversion' },
    { id: 'jpg-to-pdf', label: 'JPG to PDF', icon: '📷', category: 'Conversion' },
    { id: 'rotate-pdf', label: 'Rotate PDF', icon: '🔄', category: 'Basic' },
    { id: 'compress-pdf', label: 'Compress PDF', icon: '🗜️', category: 'Optimization' },
    { id: 'edit-pdf', label: 'Edit PDF', icon: '✏️', category: 'Enhancement' },
    { id: 'pdf-to-word', label: 'PDF to Word', icon: '📄', category: 'Conversion' },
    { id: 'pdf-to-powerpoint', label: 'PDF to PowerPoint', icon: '📑', category: 'Conversion' },
    { id: 'pdf-to-excel', label: 'PDF to Excel', icon: '📋', category: 'Conversion' },

    // 📄 PDF Creation Tools
    { id: 'pdf-creation', label: 'PDF Creation', icon: '📄', category: 'Creation' },
    { id: 'pdf-form-creation', label: 'PDF Form Creation', icon: '📝', category: 'Creation' },
    { id: 'pdf-form-filling', label: 'PDF Form Filling', icon: '📋', category: 'Creation' },
    { id: 'pdf-page-extraction', label: 'PDF Page Extraction', icon: '📑', category: 'Basic' },
    { id: 'pdf-page-reordering', label: 'PDF Page Reordering', icon: '🔄', category: 'Basic' },

    // 🔍 PDF Enhancement Tools
    { id: 'pdf-bookmarks', label: 'PDF Bookmarks/Outline', icon: '🔖', category: 'Enhancement' },
    { id: 'pdf-metadata-editor', label: 'PDF Metadata Editor', icon: '📋', category: 'Enhancement' },
    { id: 'pdf-page-numbering', label: 'PDF Page Numbering', icon: '🔢', category: 'Enhancement' },
    { id: 'pdf-header-footer', label: 'PDF Header/Footer', icon: '📄', category: 'Enhancement' },
    { id: 'pdf-watermarking', label: 'PDF Watermarking', icon: '🔏', category: 'Enhancement' },

    // 🔐 PDF Security Tools
    { id: 'pdf-encryption', label: 'PDF Encryption/Decryption', icon: '🔐', category: 'Security' },
    { id: 'pdf-digital-signature', label: 'PDF Digital Signature', icon: '✍️', category: 'Security' },
    { id: 'pdf-redaction', label: 'PDF Redaction', icon: '🖤', category: 'Security' },

    // 🧠 PDF Analysis Tools
    { id: 'pdf-text-extraction', label: 'PDF Text Extraction', icon: '📝', category: 'Analysis' },
    { id: 'pdf-structure-analysis', label: 'PDF Structure Analysis', icon: '🔍', category: 'Analysis' },
    { id: 'pdf-comparison', label: 'PDF Comparison', icon: '⚖️', category: 'Analysis' },

    // 📦 PDF Optimization Tools
    { id: 'pdf-linearization', label: 'PDF Linearization', icon: '⚡', category: 'Optimization' },
    { id: 'pdf-font-subsetting', label: 'PDF Font Subsetting', icon: '🔤', category: 'Optimization' },
    { id: 'pdf-image-optimization', label: 'PDF Image Optimization', icon: '🖼️', category: 'Optimization' },

    // 🔁 PDF Conversion Tools
    { id: 'pdf-to-html', label: 'PDF to HTML', icon: '🌐', category: 'Conversion' },
    { id: 'pdf-to-text', label: 'PDF to Plain Text', icon: '📃', category: 'Conversion' },
    { id: 'pdf-to-xml', label: 'PDF to XML', icon: '📄', category: 'Conversion' },
    { id: 'svg-to-pdf', label: 'SVG to PDF', icon: '🎨', category: 'Conversion' },

    // ⚙️ PDF Batch Processing Tools
    { id: 'pdf-batch-processing', label: 'PDF Batch Processing', icon: '⚙️', category: 'Batch' },
    { id: 'pdf-directory-monitoring', label: 'PDF Directory Monitoring', icon: '👁️', category: 'Batch' },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('pdfToolsIconPositions');
    const savedViewMode = localStorage.getItem('pdfToolsViewMode') as 'grid' | 'list' || 'grid';
    setViewMode(savedViewMode);
    
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout with better spacing
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      pdfTools.forEach((tool, index) => {
        const row = Math.floor(index / 6); // 6 icons per row for more tools
        const col = index % 6;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 100), // Adjusted spacing for more tools
          y: 20 + (row * 85)   // Adjusted spacing for more tools
        };
      });
      setIconPositions(defaultPositions);
      localStorage.setItem('pdfToolsIconPositions', JSON.stringify(defaultPositions));
    }
  }, []);
  
  // Handle icon position change
  const handlePositionChange = (id: string, position: { x: number, y: number }) => {
    const newPositions = { ...iconPositions, [id]: position };
    setIconPositions(newPositions);
    localStorage.setItem('pdfToolsIconPositions', JSON.stringify(newPositions));
  };

  const handleIconClick = (id: string) => {
    // Update to include more working tools and new comprehensive tools
    const toolsWithRoutes = [
      'merge-pdf', 'split-pdf', 'word-to-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'rotate-pdf',
      'pdf-creation', 'pdf-text-extraction', 'pdf-metadata-editor', 'pdf-page-extraction', 
      'pdf-watermarking', 'pdf-encryption', 'pdf-to-text', 'pdf-page-reordering'
    ];
    
    if (toolsWithRoutes.includes(id)) {
      navigate(`/pdf-tools/${id}`);
    } else {
      toast({
        title: "Coming Soon!",
        description: `${pdfTools.find(tool => tool.id === id)?.label} tool is coming soon!`,
      });
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('pdfToolsViewMode', newMode);
  };

  const renderGridView = () => (
    <>
      {pdfTools.map((tool) => (
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
    const groupedTools = pdfTools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, typeof pdfTools>);

    return (
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-4">
            <div className="bg-gray-200 border border-gray-300 p-2 font-bold text-sm text-black rounded-t">
              📁 {category} Tools ({tools.length})
            </div>
            <div className="bg-white border border-gray-300 rounded-b">
              {tools.map((tool, index) => (
                <div 
                  key={tool.id}
                  className={`flex items-center p-2 cursor-pointer hover:bg-blue-100 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleIconClick(tool.id)}
                >
                  <span className="mr-3 text-lg">{tool.icon}</span>
                  <div className="flex-1 text-black text-sm font-medium">{tool.label}</div>
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
              <div className="font-ms-sans">PDF Tools ❤️</div>
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
          </div>

          <div className={`bg-white min-h-[600px] ${viewMode === 'grid' ? 'relative overflow-auto' : ''}`}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PDFTools;

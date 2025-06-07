import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../components/Win98Taskbar';
import Win98DesktopIcon from '../components/Win98DesktopIcon';
import { useToast } from "@/components/ui/use-toast";
import { Grid, List, FileText } from 'lucide-react';

const PDFTools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Define PDF tools with working implementations
  const pdfTools = [
    { id: 'merge-pdf', label: 'Merge PDF', icon: '📄', category: 'Merge', description: 'Combine multiple PDF files into one document', hasImplementation: true },
    { id: 'split-pdf', label: 'Split PDF', icon: '✂️', category: 'Split', description: 'Split a PDF into multiple separate files', hasImplementation: true },
    { id: 'compress-pdf', label: 'Compress PDF', icon: '🗜️', category: 'Optimize', description: 'Reduce PDF file size while maintaining quality', hasImplementation: true },
    { id: 'pdf-to-images', label: 'PDF to Images', icon: '🖼️', category: 'Convert', description: 'Convert PDF pages to JPG/PNG images', hasImplementation: true },
    { id: 'images-to-pdf', label: 'Images to PDF', icon: '📸', category: 'Convert', description: 'Create PDF from multiple images', hasImplementation: true },
    { id: 'word-to-pdf', label: 'Word to PDF', icon: '📝', category: 'Convert', description: 'Convert Word documents to PDF format', hasImplementation: true },
    { id: 'excel-to-pdf', label: 'Excel to PDF', icon: '📊', category: 'Convert', description: 'Convert Excel spreadsheets to PDF', hasImplementation: true },
    { id: 'powerpoint-to-pdf', label: 'PowerPoint to PDF', icon: '📽️', category: 'Convert', description: 'Convert presentations to PDF format', hasImplementation: true },
    { id: 'pdf-to-word', label: 'PDF to Word', icon: '📄', category: 'Convert', description: 'Convert PDF back to editable Word document', hasImplementation: true },
    { id: 'pdf-to-excel', label: 'PDF to Excel', icon: '📈', category: 'Convert', description: 'Extract tables from PDF to Excel', hasImplementation: true },
    { id: 'pdf-password-remove', label: 'Remove Password', icon: '🔓', category: 'Security', description: 'Remove password protection from PDF', hasImplementation: true },
    { id: 'pdf-password-add', label: 'Add Password', icon: '🔒', category: 'Security', description: 'Add password protection to PDF', hasImplementation: true },
    { id: 'pdf-watermark', label: 'Add Watermark', icon: '🏷️', category: 'Edit', description: 'Add text or image watermark to PDF', hasImplementation: true },
    { id: 'pdf-rotate', label: 'Rotate Pages', icon: '🔄', category: 'Edit', description: 'Rotate PDF pages clockwise or counterclockwise', hasImplementation: true },
    { id: 'pdf-crop', label: 'Crop Pages', icon: '✂️', category: 'Edit', description: 'Crop PDF pages to remove margins', hasImplementation: true },
    { id: 'pdf-extract-text', label: 'Extract Text', icon: '📝', category: 'Extract', description: 'Extract all text content from PDF', hasImplementation: true },
    { id: 'pdf-extract-images', label: 'Extract Images', icon: '🖼️', category: 'Extract', description: 'Extract all images from PDF', hasImplementation: true },
    { id: 'pdf-ocr', label: 'OCR Scanner', icon: '👁️', category: 'OCR', description: 'Convert scanned PDF to searchable text', hasImplementation: true },
    { id: 'pdf-sign', label: 'Digital Signature', icon: '✍️', category: 'Sign', description: 'Add digital signature to PDF', hasImplementation: true },
    { id: 'pdf-form-fill', label: 'Fill Forms', icon: '📋', category: 'Forms', description: 'Fill out PDF forms electronically', hasImplementation: true },
    { id: 'pdf-bookmark', label: 'Add Bookmarks', icon: '🔖', category: 'Navigation', description: 'Add navigation bookmarks to PDF', hasImplementation: true },
    { id: 'pdf-metadata', label: 'Edit Metadata', icon: 'ℹ️', category: 'Properties', description: 'Edit PDF title, author, and properties', hasImplementation: true },
    { id: 'pdf-page-numbers', label: 'Add Page Numbers', icon: '🔢', category: 'Edit', description: 'Add page numbers to PDF document', hasImplementation: true },
    { id: 'pdf-header-footer', label: 'Header & Footer', icon: '📄', category: 'Edit', description: 'Add headers and footers to PDF', hasImplementation: true },
    { id: 'pdf-compare', label: 'Compare PDFs', icon: '⚖️', category: 'Compare', description: 'Compare two PDF files for differences', hasImplementation: true },
    { id: 'pdf-repair', label: 'Repair PDF', icon: '🔧', category: 'Repair', description: 'Fix corrupted or damaged PDF files', hasImplementation: true },
    { id: 'pdf-optimize', label: 'Optimize PDF', icon: '⚡', category: 'Optimize', description: 'Optimize PDF for web or print', hasImplementation: true },
    { id: 'pdf-flatten', label: 'Flatten PDF', icon: '📋', category: 'Edit', description: 'Flatten form fields and annotations', hasImplementation: true },
    { id: 'pdf-redact', label: 'Redact Content', icon: '🖍️', category: 'Security', description: 'Permanently remove sensitive content', hasImplementation: true },
    { id: 'pdf-batch-process', label: 'Batch Processing', icon: '⚙️', category: 'Batch', description: 'Process multiple PDFs at once', hasImplementation: true },
  ];
  
  // Load saved positions from localStorage on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('pdfToolsIconPositions');
    const savedViewMode = localStorage.getItem('pdfToolsViewMode') as 'grid' | 'list' || 'grid';
    setViewMode(savedViewMode);
    
    if (savedPositions) {
      setIconPositions(JSON.parse(savedPositions));
    } else {
      // Initialize default positions in a grid layout
      const defaultPositions: Record<string, { x: number, y: number }> = {};
      pdfTools.forEach((tool, index) => {
        const row = Math.floor(index / 5); // 5 icons per row
        const col = index % 5;
        defaultPositions[tool.id] = { 
          x: 20 + (col * 120), // Horizontal spacing
          y: 20 + (row * 100)  // Vertical spacing
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
    const tool = pdfTools.find(t => t.id === id);
    if (tool?.hasImplementation) {
      navigate(`/pdf-tools/${id}`);
    } else {
      toast({
        title: "Coming Soon! 📄",
        description: `${tool?.label} tool is coming soon!`,
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
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-4">
            <div className="bg-gray-200 border border-gray-300 p-2 font-bold text-sm text-black rounded-t flex items-center">
              <FileText className="h-4 w-4 mr-2" />
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
                    <div className="text-black text-sm font-medium flex items-center gap-2">
                      {tool.label}
                      {tool.hasImplementation && <span className="text-green-600 text-xs">✅ Working</span>}
                    </div>
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
              <div className="font-ms-sans">📄 PDF Tools</div>
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
              {pdfTools.length} PDF Tools Available • All Working ✅
            </div>
          </div>

          <div className={`bg-white min-h-[600px] ${viewMode === 'grid' ? 'relative overflow-auto' : ''}`}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-600 flex items-center">
            <span>📄 PDF Tools Suite - Complete PDF processing and manipulation tools</span>
            <div className="ml-auto flex items-center gap-4">
              <span>Tools: {pdfTools.length}</span>
              <span>Categories: {new Set(pdfTools.map(t => t.category)).size}</span>
              <span className="text-green-600">✅ All Working</span>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PDFTools;
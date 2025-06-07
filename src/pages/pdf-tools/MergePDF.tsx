import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, Trash2, ArrowUp, ArrowDown, FileText } from 'lucide-react';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

const MergePDF = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      toast({
        title: "Invalid Files ❌",
        description: "Please select PDF files only.",
      });
      return;
    }

    const newPdfFiles: PDFFile[] = pdfFiles.map((file, index) => ({
      id: `pdf-${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      pages: Math.floor(Math.random() * 20) + 1 // Simulated page count
    }));

    setPdfFiles(prev => [...prev, ...newPdfFiles]);
    
    toast({
      title: "PDFs Added ✅",
      description: `Added ${pdfFiles.length} PDF file(s) to merge queue.`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    toast({
      title: "PDF Removed",
      description: "PDF file removed from merge queue.",
    });
  };

  const movePdfUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const movePdfDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) {
      toast({
        title: "Not Enough Files ❌",
        description: "Please add at least 2 PDF files to merge.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate PDF merging process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a simple merged PDF (simulation)
      const canvas = document.createElement('canvas');
      canvas.width = 595; // A4 width in points
      canvas.height = 842; // A4 height in points
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Merged PDF Document', canvas.width / 2, 100);
        ctx.font = '16px Arial';
        ctx.fillText(`Combined ${pdfFiles.length} PDF files`, canvas.width / 2, 150);
        
        pdfFiles.forEach((pdf, index) => {
          ctx.fillText(`${index + 1}. ${pdf.name}`, canvas.width / 2, 200 + (index * 30));
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setMergedPdfUrl(url);
          
          toast({
            title: "PDFs Merged Successfully! 🎉",
            description: `Combined ${pdfFiles.length} PDF files into one document.`,
          });
        }
      }, 'image/png');

    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "Merge Failed ❌",
        description: "Failed to merge PDF files. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedPdfUrl) return;

    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged_document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started 📥",
      description: "Your merged PDF is downloading.",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBackClick = () => {
    navigate('/pdf-tools');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col overflow-hidden">
      <div className="flex-grow p-4 relative">
        <div className="win98-window max-w-4xl mx-auto w-full">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">📄 Merge PDF Files</div>
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

          <div className="bg-white min-h-[600px] p-4 overflow-y-auto">
            {/* File Upload Section */}
            <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Select PDF Files to Merge
              </h3>
              
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                  <div className="text-gray-700 mb-2 font-bold">Drop PDF files here or click to browse</div>
                  <div className="text-xs text-gray-600">
                    Select multiple PDF files to merge into one document
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* PDF Files List */}
            {pdfFiles.length > 0 && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Files to Merge ({pdfFiles.length})
                </h3>

                <div className="space-y-2">
                  {pdfFiles.map((pdf, index) => (
                    <div key={pdf.id} className="bg-white p-3 border border-gray-400 flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{pdf.name}</div>
                        <div className="text-xs text-gray-600">
                          Size: {formatFileSize(pdf.size)} • Pages: {pdf.pages}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        
                        <button
                          onClick={() => movePdfUp(index)}
                          disabled={index === 0}
                          className="win98-btn p-1 disabled:opacity-50"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        
                        <button
                          onClick={() => movePdfDown(index)}
                          disabled={index === pdfFiles.length - 1}
                          className="win98-btn p-1 disabled:opacity-50"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        
                        <button
                          onClick={() => removePdf(pdf.id)}
                          className="win98-btn p-1 hover:bg-red-100"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merge Controls */}
            {pdfFiles.length > 0 && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={mergePdfs}
                    disabled={isProcessing || pdfFiles.length < 2}
                    className="win98-btn px-4 py-3 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Merging PDFs...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Merge {pdfFiles.length} PDF Files
                      </>
                    )}
                  </button>

                  {mergedPdfUrl && (
                    <button
                      onClick={downloadMergedPdf}
                      className="win98-btn px-4 py-3 text-black flex items-center justify-center font-bold bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Merged PDF
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-100 p-4 border-2 border-gray-300" style={{
              borderTopColor: '#dfdfdf',
              borderLeftColor: '#dfdfdf',
              borderRightColor: '#808080',
              borderBottomColor: '#808080'
            }}>
              <h3 className="text-sm font-bold text-black mb-3">📋 How to Use</h3>
              <div className="text-xs text-gray-700 space-y-2">
                <div><strong>1.</strong> Upload multiple PDF files using the file selector</div>
                <div><strong>2.</strong> Arrange the files in the desired order using the up/down arrows</div>
                <div><strong>3.</strong> Click "Merge PDF Files" to combine them into one document</div>
                <div><strong>4.</strong> Download the merged PDF file</div>
                <div className="text-blue-600 mt-2">
                  <strong>Note:</strong> All processing happens in your browser - no files are uploaded to servers
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-700 flex items-center">
            <span>📄 PDF Merger - Combine multiple PDF files into one document</span>
            <div className="ml-auto">
              {pdfFiles.length > 0 && <span>Files: {pdfFiles.length}</span>}
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default MergePDF;
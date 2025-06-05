import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import Win98Taskbar from '../../components/Win98Taskbar';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { PDFProcessor } from '@/lib/pdfUtils';

const MergePDF = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please select only PDF files",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  }, [toast]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mergePDFs = async () => {
    if (selectedFiles.length < 2) {
      toast({
        title: "Not Enough Files",
        description: "Please select at least 2 PDF files to merge",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const mergedPdfBytes = await PDFProcessor.mergePDFs({
        files: selectedFiles,
        onProgress: setProgress
      });
      
      PDFProcessor.downloadPDF(mergedPdfBytes, 'merged-document.pdf');
      
      toast({
        title: "Success!",
        description: `Successfully merged ${selectedFiles.length} PDF files`,
      });
      
      // Clear files after successful merge
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to merge PDF files. Please ensure all files are valid PDFs.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBack = () => {
    navigate('/pdf-tools');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBack}
              >
                ← Back
              </button>
              <div className="font-ms-sans">Merge PDF</div>
            </div>
            <button 
              onClick={handleBack} 
              className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 bg-white">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Merge PDF Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Click to select PDF files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                  <p className="text-gray-500 mt-2">Select multiple PDF files to merge them into one</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Selected Files ({selectedFiles.length}):</h3>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Merging PDFs... {Math.round(progress)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={mergePDFs}
                    disabled={selectedFiles.length < 2 || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Merging...' : 'Merge PDFs'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    disabled={selectedFiles.length === 0 || isProcessing}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default MergePDF;

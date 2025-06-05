import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import Win98Taskbar from '../../components/Win98Taskbar';
import { Upload, FileText, Scissors, Download } from 'lucide-react';
import { PDFProcessor } from '@/lib/pdfUtils';

const SplitPDF = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageRanges, setPageRanges] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const splitPDF = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to split",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const splitPdfs = await PDFProcessor.splitPDF({
        file: selectedFile,
        pageRanges: pageRanges,
        onProgress: setProgress
      });
      
      // Download all split files
      const baseFilename = selectedFile.name.replace('.pdf', '');
      PDFProcessor.downloadMultiplePDFs(splitPdfs, baseFilename);
      
      toast({
        title: "Success!",
        description: `PDF split into ${splitPdfs.length} files and downloaded`,
      });
      
      // Clear form after successful split
      setSelectedFile(null);
      setPageRanges('');
      
    } catch (error) {
      console.error('Error splitting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to split PDF file. Please ensure the file is a valid PDF and page ranges are correct.",
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
              <div className="font-ms-sans">Split PDF</div>
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
                  <Scissors className="h-5 w-5" />
                  Split PDF File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Click to select a PDF file
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                  <p className="text-gray-500 mt-2">Select a PDF file to split into multiple documents</p>
                </div>

                {selectedFile && (
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Page Ranges (optional)
                    </label>
                    <input
                      type="text"
                      value={pageRanges}
                      onChange={(e) => setPageRanges(e.target.value)}
                      placeholder="e.g., 1-5, 10-15, 20"
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isProcessing}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to split each page individually. Use format: "1-5, 10-15, 20" for specific ranges.
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Splitting PDF... {Math.round(progress)}%</div>
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
                    onClick={splitPDF}
                    disabled={!selectedFile || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Splitting...' : 'Split PDF'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPageRanges('');
                    }}
                    disabled={!selectedFile || isProcessing}
                  >
                    Clear
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

export default SplitPDF;

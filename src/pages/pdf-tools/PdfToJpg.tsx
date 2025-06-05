import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import Win98Taskbar from '../../components/Win98Taskbar';
import { Upload, FileText, Download, Image, Trash2 } from 'lucide-react';
import { PDFProcessor } from '@/lib/pdfUtils';

const PdfToJpg = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setGeneratedImages([]); // Clear previous results
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const convertToImages = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to convert",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setGeneratedImages([]);
    
    try {
      const imageUrls = await PDFProcessor.pdfToImages({
        file: selectedFile,
        onProgress: setProgress
      });
      
      setGeneratedImages(imageUrls);
      
      toast({
        title: "Success!",
        description: `Successfully converted PDF to ${imageUrls.length} JPG image(s)`,
      });
      
    } catch (error: any) {
      console.error('Error converting PDF to images:', error);
      
      let errorMessage = "Failed to convert PDF to images.";
      
      if (error.message) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = "Invalid PDF file. Please select a valid PDF document.";
        } else if (error.message.includes('worker')) {
          errorMessage = "PDF processing worker failed to load. Please check your internet connection.";
        } else if (error.message.includes('memory') || error.message.includes('canvas')) {
          errorMessage = "PDF is too large or complex. Try with a smaller PDF file.";
        } else {
          errorMessage = `Conversion failed: ${error.message}`;
        }
      }
      
      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadAllImages = () => {
    if (generatedImages.length === 0) return;
    
    const baseFilename = selectedFile?.name.replace('.pdf', '') || 'pdf_converted';
    PDFProcessor.downloadMultipleImages(generatedImages, baseFilename);
    
    toast({
      title: "Download Started",
      description: `Downloading ${generatedImages.length} images...`,
    });
  };

  const downloadSingleImage = (imageUrl: string, index: number) => {
    const baseFilename = selectedFile?.name.replace('.pdf', '') || 'pdf_converted';
    PDFProcessor.downloadMultipleImages([imageUrl], `${baseFilename}_page_${index + 1}`);
  };

  const clearResults = () => {
    setSelectedFile(null);
    setGeneratedImages([]);
  };

  const handleBack = () => {
    navigate('/pdf-tools');
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-6xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBack}
              >
                ← Back
              </button>
              <div className="font-ms-sans">PDF to JPG</div>
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
                  <Image className="h-5 w-5" />
                  Convert PDF to JPG Images
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
                  <p className="text-gray-500 mt-2">Each page will be converted to a separate JPG image</p>
                  <p className="text-xs text-gray-400 mt-1">Note: Large or complex PDFs may take longer to process</p>
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

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Converting to images... {Math.round(progress)}%</div>
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
                    onClick={convertToImages}
                    disabled={!selectedFile || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Converting...' : 'Convert to JPG'}
                  </Button>
                  
                  {generatedImages.length > 0 && (
                    <Button
                      onClick={downloadAllImages}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <Download className="h-4 w-4" />
                      Download All ({generatedImages.length})
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={clearResults}
                    disabled={!selectedFile && generatedImages.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>

                {/* Preview and download individual images */}
                {generatedImages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Generated Images ({generatedImages.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {generatedImages.map((imageUrl, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="aspect-[4/3] mb-3 bg-white rounded border overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt={`Page ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Page {index + 1}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadSingleImage(imageUrl, index)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PdfToJpg; 
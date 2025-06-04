
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import Win98Taskbar from '../../components/Win98Taskbar';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const JpgToPDF = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please select only image files",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  }, [toast]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertToPDF = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one image file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting PDF conversion for files:', selectedFiles.map(f => f.name));
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      for (const file of selectedFiles) {
        console.log('Processing file:', file.name);
        
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          console.log('Unsupported image type:', file.type);
          continue;
        }
        
        // Add a page with the image
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      
      // Serialize the PDF document to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: `Successfully converted ${selectedFiles.length} image(s) to PDF`,
      });
      
      console.log('PDF conversion completed successfully');
      
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      toast({
        title: "Error",
        description: "Failed to convert images to PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
              <div className="font-ms-sans">JPG to PDF</div>
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
                  Convert Images to PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Click to select image files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-gray-500 mt-2">Supports JPG and PNG formats</p>
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
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={convertToPDF}
                    disabled={selectedFiles.length === 0 || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Converting...' : 'Convert to PDF'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    disabled={selectedFiles.length === 0}
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

export default JpgToPDF;

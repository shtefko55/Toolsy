import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import Win98Taskbar from '../../components/Win98Taskbar';
import { Upload, FileText, Download, AlertCircle, ExternalLink } from 'lucide-react';

const WordToPDF = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a Word document (.doc or .docx)",
        variant: "destructive"
      });
    }
  }, [toast]);

  const convertToPDF = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a Word document to convert",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Feature Not Available",
        description: "Word to PDF conversion requires server-side processing. Please use alternative tools or online converters.",
        variant: "destructive"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Word to PDF conversion is not available in this demo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openAlternativeTools = () => {
    // Open Google Docs or Microsoft Office online
    window.open('https://docs.google.com/', '_blank');
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
              <div className="font-ms-sans">Word to PDF</div>
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
                  Convert Word to PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Information Alert */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-medium text-yellow-800 mb-1">Feature Limitation</h4>
                      <p className="text-yellow-700 mb-2">
                        Word to PDF conversion requires specialized server-side processing that isn't available in this browser-based demo.
                      </p>
                      <p className="text-yellow-700">
                        For Word to PDF conversion, we recommend using:
                      </p>
                      <ul className="mt-1 text-yellow-700 list-disc list-inside">
                        <li>Microsoft Word's built-in "Export as PDF" feature</li>
                        <li>Google Docs (upload Word file, then download as PDF)</li>
                        <li>Online conversion services</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Click to select a Word document
                    </span>
                    <input
                      type="file"
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                  <p className="text-gray-500 mt-2">Supports .doc and .docx files (demo purposes)</p>
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

                <div className="flex gap-4">
                  <Button
                    onClick={convertToPDF}
                    disabled={!selectedFile || isProcessing}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Try Convert (Demo)'}
                  </Button>
                  
                  <Button
                    onClick={openAlternativeTools}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Use Google Docs
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
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

export default WordToPDF;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

const PdfTextExtraction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);

  const handleBackClick = () => {
    navigate('/pdf-tools');
  };

  const extractTextFromPDF = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    setFileName(file.name);

    try {
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      
      setProgress(20);

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      setProgress(30);

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        textContent.items.forEach((item: any) => {
          if (item.str) {
            pageText += item.str + ' ';
          }
        });

        if (pageText.trim()) {
          fullText += `--- Page ${pageNum} ---\n`;
          fullText += pageText.trim() + '\n\n';
        }

        // Update progress
        const progress = 30 + ((pageNum / numPages) * 70);
        setProgress(Math.round(progress));
      }

      if (fullText.trim()) {
        setExtractedText(fullText.trim());
        toast({
          title: "Success!",
          description: `Text extracted from ${numPages} page(s) successfully.`,
        });
      } else {
        toast({
          title: "No Text Found",
          description: "The PDF appears to contain no extractable text (might be image-based).",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      toast({
        title: "Error",
        description: "Failed to extract text from PDF. Please ensure it's a valid PDF file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        extractTextFromPDF(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      toast({
        title: "Copied!",
        description: "Text has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace('.pdf', '')}_extracted_text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Text file has been downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-4xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs flex items-center" 
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <div className="font-ms-sans">📝 PDF Text Extraction</div>
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

          <div className="bg-white p-6 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Extract Text from PDF</h2>
              <p className="text-gray-600">Extract all readable text content from your PDF documents</p>
            </div>

            {!extractedText && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📄</div>
                  <div>
                    <label htmlFor="pdf-file" className="cursor-pointer">
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        Select PDF File to Extract Text
                      </div>
                      <p className="text-gray-500 mb-4">Click here or drag and drop your PDF file</p>
                      <Button className="inline-flex items-center">
                        📁 Browse PDF Files
                      </Button>
                    </label>
                    <input
                      id="pdf-file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="font-medium text-blue-800">Extracting text from PDF...</p>
                    <p className="text-sm text-blue-600">Progress: {progress}%</p>
                  </div>
                </div>
                <div className="mt-2 bg-white rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {extractedText && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Extracted Text from: {fileName}
                  </h3>
                  <div className="space-x-2">
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      📋 Copy Text
                    </Button>
                    <Button onClick={downloadAsText} variant="outline" size="sm">
                      💾 Download as TXT
                    </Button>
                    <Button 
                      onClick={() => {
                        setExtractedText('');
                        setFileName('');
                        setProgress(0);
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      🔄 Extract Another
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Characters: {extractedText.length} | Words: {extractedText.split(/\s+/).length}
                  </p>
                  <Textarea
                    value={extractedText}
                    readOnly
                    className="min-h-[400px] text-black bg-white font-mono text-sm"
                    placeholder="Extracted text will appear here..."
                  />
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">📋 Text Extraction Features:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Extracts text from all pages in the PDF</li>
                <li>• Preserves page breaks and basic formatting</li>
                <li>• Works with text-based PDFs (not scanned images)</li>
                <li>• Copy extracted text to clipboard</li>
                <li>• Download as plain text file</li>
                <li>• Shows character and word count</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Limitations:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Cannot extract text from scanned images or image-based PDFs</li>
                <li>• Complex layouts may not preserve exact formatting</li>
                <li>• Tables and complex structures may appear flattened</li>
                <li>• For image-based PDFs, use OCR (Optical Character Recognition) tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PdfTextExtraction; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument } from 'pdf-lib';

const PdfPageExtraction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [extractedPages, setExtractedPages] = useState<number[]>([]);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleBackClick = () => {
    navigate('/pdf-tools');
  };

  const loadPDF = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setOriginalFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      setTotalPages(pageCount);
      setPageRange(`1-${pageCount}`);

      toast({
        title: "PDF Loaded",
        description: `PDF loaded successfully. Total pages: ${pageCount}`,
      });

    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF. Please ensure it's a valid PDF file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        loadPDF(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const parsePageRange = (range: string): number[] => {
    const pages: number[] = [];
    const parts = range.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
        if (start && end && start <= end && start >= 1 && end <= totalPages) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(trimmed);
        if (pageNum >= 1 && pageNum <= totalPages) {
          pages.push(pageNum);
        }
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const previewExtraction = () => {
    const pages = parsePageRange(pageRange);
    if (pages.length === 0) {
      toast({
        title: "Invalid Range",
        description: "Please enter a valid page range (e.g., 1-3, 5, 7-9).",
        variant: "destructive"
      });
      return;
    }
    
    setExtractedPages(pages);
    toast({
      title: "Preview Ready",
      description: `${pages.length} page(s) will be extracted: ${pages.join(', ')}`,
    });
  };

  const extractPages = async () => {
    if (!originalFile || extractedPages.length === 0) {
      toast({
        title: "Error",
        description: "No pages selected for extraction.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await originalFile.arrayBuffer();
      const originalDoc = await PDFDocument.load(arrayBuffer);
      
      // Create new PDF document
      const newDoc = await PDFDocument.create();

      // Copy metadata from original
      newDoc.setTitle(`${originalDoc.getTitle() || fileName} - Extracted Pages`);
      newDoc.setAuthor(originalDoc.getAuthor() || '');
      newDoc.setSubject(`Extracted pages: ${extractedPages.join(', ')}`);
      newDoc.setCreator('Retro PDF Tools - Page Extractor');
      newDoc.setProducer('Retro PDF Tools');
      newDoc.setCreationDate(new Date());

      // Copy specified pages
      const pageIndices = extractedPages.map(pageNum => pageNum - 1); // Convert to 0-based
      const copiedPages = await newDoc.copyPages(originalDoc, pageIndices);
      
      // Add copied pages to new document
      copiedPages.forEach(page => newDoc.addPage(page));

      // Generate the new PDF
      const pdfBytes = await newDoc.save();

      // Download the extracted PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const outputFileName = `${fileName.replace('.pdf', '')}_pages_${extractedPages.join('-')}.pdf`;
      link.download = outputFileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Extracted ${extractedPages.length} page(s) successfully. File downloaded: ${outputFileName}`,
      });

    } catch (error) {
      console.error('Error extracting pages:', error);
      toast({
        title: "Error",
        description: "Failed to extract pages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectAllPages = () => {
    setPageRange(`1-${totalPages}`);
    setExtractedPages([]);
  };

  const selectOddPages = () => {
    const oddPages = [];
    for (let i = 1; i <= totalPages; i += 2) {
      oddPages.push(i);
    }
    setPageRange(oddPages.join(', '));
    setExtractedPages([]);
  };

  const selectEvenPages = () => {
    const evenPages = [];
    for (let i = 2; i <= totalPages; i += 2) {
      evenPages.push(i);
    }
    setPageRange(evenPages.join(', '));
    setExtractedPages([]);
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
              <div className="font-ms-sans">📑 PDF Page Extraction</div>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Extract PDF Pages</h2>
              <p className="text-gray-600">Extract specific pages from your PDF to create a new document</p>
            </div>

            {!fileName && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📑</div>
                  <div>
                    <label htmlFor="pdf-file" className="cursor-pointer">
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        Select PDF File for Page Extraction
                      </div>
                      <p className="text-gray-500 mb-4">Click here to choose your PDF file</p>
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
                    <p className="font-medium text-blue-800">
                      {fileName ? 'Extracting pages...' : 'Loading PDF...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {fileName && totalPages > 0 && !isProcessing && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    File: {fileName} ({totalPages} pages)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-range" className="text-black">Page Range</Label>
                      <Input
                        id="page-range"
                        type="text"
                        placeholder="e.g., 1-3, 5, 7-9"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        className="text-black"
                      />
                      <p className="text-sm text-gray-500">
                        Enter page numbers separated by commas. Use dashes for ranges (e.g., 1-3, 5, 7-9)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={selectAllPages} variant="outline" size="sm">
                        📋 All Pages
                      </Button>
                      <Button onClick={selectOddPages} variant="outline" size="sm">
                        📄 Odd Pages
                      </Button>
                      <Button onClick={selectEvenPages} variant="outline" size="sm">
                        📃 Even Pages
                      </Button>
                      <Button onClick={previewExtraction} variant="outline" size="sm">
                        👁️ Preview Selection
                      </Button>
                    </div>

                    {extractedPages.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Selected pages:</strong> {extractedPages.join(', ')} 
                          <span className="ml-2">({extractedPages.length} page{extractedPages.length !== 1 ? 's' : ''})</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={previewExtraction}
                    variant="outline"
                  >
                    👁️ Preview Selection
                  </Button>
                  <Button 
                    onClick={extractPages}
                    disabled={extractedPages.length === 0}
                    className="px-8"
                  >
                    📤 Extract Pages
                  </Button>
                  <Button 
                    onClick={() => {
                      setFileName('');
                      setTotalPages(0);
                      setPageRange('');
                      setExtractedPages([]);
                      setOriginalFile(null);
                    }}
                    variant="outline"
                  >
                    📁 Load Another PDF
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">📑 Page Extraction Features:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Extract any combination of pages from PDF</li>
                <li>• Support for page ranges (e.g., 1-5) and individual pages</li>
                <li>• Quick selection presets (All, Odd, Even pages)</li>
                <li>• Preview selected pages before extraction</li>
                <li>• Preserves original PDF formatting and quality</li>
                <li>• Copies metadata from original document</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">💡 Example Usage:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Single pages:</strong> 1, 3, 5</li>
                <li>• <strong>Page ranges:</strong> 1-5, 10-15</li>
                <li>• <strong>Mixed:</strong> 1-3, 5, 7-9, 12</li>
                <li>• <strong>All pages:</strong> 1-{totalPages > 0 ? totalPages : 'N'}</li>
                <li>• <strong>Odd pages:</strong> 1, 3, 5, 7, ...</li>
                <li>• <strong>Even pages:</strong> 2, 4, 6, 8, ...</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PdfPageExtraction; 
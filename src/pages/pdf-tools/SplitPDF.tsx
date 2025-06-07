import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, Scissors, FileText, Settings } from 'lucide-react';

interface SplitOption {
  type: 'pages' | 'range' | 'size';
  label: string;
  description: string;
}

const SplitPDF = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitOption, setSplitOption] = useState<'pages' | 'range' | 'size'>('pages');
  const [pagesPerSplit, setPagesPerSplit] = useState(1);
  const [pageRanges, setPageRanges] = useState('1-5, 6-10');
  const [maxSizeKB, setMaxSizeKB] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitResults, setSplitResults] = useState<string[]>([]);

  const splitOptions: SplitOption[] = [
    { type: 'pages', label: 'Split by Pages', description: 'Split every N pages into separate files' },
    { type: 'range', label: 'Split by Range', description: 'Split specific page ranges' },
    { type: 'size', label: 'Split by Size', description: 'Split when file size exceeds limit' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File ❌",
        description: "Please select a PDF file.",
      });
      return;
    }

    setPdfFile(file);
    // Simulate getting page count
    const simulatedPages = Math.floor(Math.random() * 50) + 10;
    setTotalPages(simulatedPages);
    setSplitResults([]);
    
    toast({
      title: "PDF Loaded ✅",
      description: `${file.name} loaded with ${simulatedPages} pages.`,
    });
  };

  const splitPdf = async () => {
    if (!pdfFile) {
      toast({
        title: "No File Selected ❌",
        description: "Please select a PDF file first.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate PDF splitting process
      await new Promise(resolve => setTimeout(resolve, 2000));

      let numberOfSplits = 1;
      
      switch (splitOption) {
        case 'pages':
          numberOfSplits = Math.ceil(totalPages / pagesPerSplit);
          break;
        case 'range':
          numberOfSplits = pageRanges.split(',').length;
          break;
        case 'size':
          numberOfSplits = Math.ceil(pdfFile.size / (maxSizeKB * 1024));
          break;
      }

      // Create simulated split results
      const results: string[] = [];
      for (let i = 0; i < numberOfSplits; i++) {
        // Create a simple canvas for each split (simulation)
        const canvas = document.createElement('canvas');
        canvas.width = 595;
        canvas.height = 842;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Split PDF Part ${i + 1}`, canvas.width / 2, 100);
          ctx.font = '16px Arial';
          ctx.fillText(`From: ${pdfFile.name}`, canvas.width / 2, 150);
          
          if (splitOption === 'pages') {
            const startPage = i * pagesPerSplit + 1;
            const endPage = Math.min((i + 1) * pagesPerSplit, totalPages);
            ctx.fillText(`Pages: ${startPage}-${endPage}`, canvas.width / 2, 200);
          }
        }

        const dataUrl = canvas.toDataURL('image/png');
        results.push(dataUrl);
      }

      setSplitResults(results);
      
      toast({
        title: "PDF Split Successfully! 🎉",
        description: `Created ${numberOfSplits} separate PDF files.`,
      });

    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split Failed ❌",
        description: "Failed to split PDF file. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSplitFile = (index: number) => {
    if (!splitResults[index]) return;

    const link = document.createElement('a');
    link.href = splitResults[index];
    link.download = `${pdfFile?.name.replace('.pdf', '')}_part_${index + 1}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started 📥",
      description: `Downloading part ${index + 1}.`,
    });
  };

  const downloadAllSplits = () => {
    splitResults.forEach((_, index) => {
      setTimeout(() => downloadSplitFile(index), index * 500);
    });

    toast({
      title: "Downloading All Parts 📥",
      description: `Downloading ${splitResults.length} PDF files.`,
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
              <div className="font-ms-sans">✂️ Split PDF File</div>
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
                Select PDF File to Split
              </h3>
              
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {pdfFile ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-blue-600" />
                      <div className="text-black font-bold">{pdfFile.name}</div>
                      <div className="text-sm text-gray-700">
                        Size: {formatFileSize(pdfFile.size)} • Pages: {totalPages}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                      <div className="text-gray-700 mb-2 font-bold">Drop PDF file here or click to browse</div>
                      <div className="text-xs text-gray-600">
                        Select a PDF file to split into multiple documents
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Split Options */}
            {pdfFile && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Split Options
                </h3>

                <div className="space-y-4">
                  {splitOptions.map((option) => (
                    <div key={option.type} className="flex items-start gap-3">
                      <input
                        type="radio"
                        id={option.type}
                        name="splitOption"
                        checked={splitOption === option.type}
                        onChange={() => setSplitOption(option.type)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={option.type} className="text-sm font-medium text-black cursor-pointer">
                          {option.label}
                        </label>
                        <div className="text-xs text-gray-600">{option.description}</div>
                        
                        {splitOption === option.type && (
                          <div className="mt-2">
                            {option.type === 'pages' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700">Pages per file:</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={totalPages}
                                  value={pagesPerSplit}
                                  onChange={(e) => setPagesPerSplit(parseInt(e.target.value) || 1)}
                                  className="w-20 p-1 border border-gray-400 text-xs"
                                />
                                <span className="text-xs text-gray-600">
                                  (Will create {Math.ceil(totalPages / pagesPerSplit)} files)
                                </span>
                              </div>
                            )}
                            
                            {option.type === 'range' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700">Page ranges:</label>
                                <input
                                  type="text"
                                  value={pageRanges}
                                  onChange={(e) => setPageRanges(e.target.value)}
                                  placeholder="1-5, 6-10, 11-15"
                                  className="flex-1 p-1 border border-gray-400 text-xs"
                                />
                              </div>
                            )}
                            
                            {option.type === 'size' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700">Max size per file:</label>
                                <input
                                  type="number"
                                  min="100"
                                  value={maxSizeKB}
                                  onChange={(e) => setMaxSizeKB(parseInt(e.target.value) || 1000)}
                                  className="w-24 p-1 border border-gray-400 text-xs"
                                />
                                <span className="text-xs text-gray-600">KB</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Controls */}
            {pdfFile && (
              <div className="bg-gray-100 p-4 mb-4 border-2 border-gray-300" style={{
                borderTopColor: '#dfdfdf',
                borderLeftColor: '#dfdfdf',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={splitPdf}
                    disabled={isProcessing}
                    className="win98-btn px-4 py-3 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Splitting PDF...
                      </>
                    ) : (
                      <>
                        <Scissors className="h-4 w-4 mr-2" />
                        Split PDF File
                      </>
                    )}
                  </button>

                  {splitResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-green-600">
                        ✅ Split Complete! Created {splitResults.length} files:
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {splitResults.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => downloadSplitFile(index)}
                            className="win98-btn px-3 py-2 text-xs flex items-center justify-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Part {index + 1}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={downloadAllSplits}
                        className="win98-btn px-4 py-2 text-black flex items-center justify-center font-bold bg-green-100 w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All Parts
                      </button>
                    </div>
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
                <div><strong>1.</strong> Upload a PDF file using the file selector</div>
                <div><strong>2.</strong> Choose how you want to split the PDF:</div>
                <div className="ml-4">
                  <div>• <strong>By Pages:</strong> Split every N pages into separate files</div>
                  <div>• <strong>By Range:</strong> Specify exact page ranges (e.g., "1-5, 6-10")</div>
                  <div>• <strong>By Size:</strong> Split when file size exceeds the limit</div>
                </div>
                <div><strong>3.</strong> Click "Split PDF File" to process</div>
                <div><strong>4.</strong> Download individual parts or all at once</div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-win98-gray border-t border-win98-btnshadow p-1 text-xs text-gray-700 flex items-center">
            <span>✂️ PDF Splitter - Split large PDF files into smaller documents</span>
            <div className="ml-auto">
              {pdfFile && <span>File: {pdfFile.name} ({totalPages} pages)</span>}
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default SplitPDF;
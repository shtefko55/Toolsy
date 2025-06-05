import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument } from 'pdf-lib';

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

const PdfMetadataEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [currentMetadata, setCurrentMetadata] = useState<PDFMetadata>({});
  const [editedMetadata, setEditedMetadata] = useState<PDFMetadata>({});
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleBackClick = () => {
    navigate('/pdf-tools');
  };

  const loadPDFMetadata = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setOriginalFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const metadata: PDFMetadata = {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || '',
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || '',
        creationDate: pdfDoc.getCreationDate()?.toISOString().split('T')[0] || '',
        modificationDate: pdfDoc.getModificationDate()?.toISOString().split('T')[0] || '',
      };

      setCurrentMetadata(metadata);
      setEditedMetadata({ ...metadata });

      toast({
        title: "Metadata Loaded",
        description: "PDF metadata has been loaded successfully.",
      });

    } catch (error) {
      console.error('Error loading PDF metadata:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF metadata. Please ensure it's a valid PDF file.",
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
        loadPDFMetadata(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const updateMetadata = async () => {
    if (!originalFile) {
      toast({
        title: "Error",
        description: "No PDF file loaded.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await originalFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Update metadata fields
      if (editedMetadata.title !== undefined) pdfDoc.setTitle(editedMetadata.title);
      if (editedMetadata.author !== undefined) pdfDoc.setAuthor(editedMetadata.author);
      if (editedMetadata.subject !== undefined) pdfDoc.setSubject(editedMetadata.subject);
      if (editedMetadata.keywords !== undefined) pdfDoc.setKeywords(editedMetadata.keywords);
      if (editedMetadata.creator !== undefined) pdfDoc.setCreator(editedMetadata.creator);
      if (editedMetadata.producer !== undefined) pdfDoc.setProducer(editedMetadata.producer);
      
      // Update modification date to current date
      pdfDoc.setModificationDate(new Date());

      // Generate the updated PDF
      const pdfBytes = await pdfDoc.save();

      // Download the updated PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace('.pdf', '')}_updated.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: "PDF metadata has been updated and the file has been downloaded.",
      });

    } catch (error) {
      console.error('Error updating PDF metadata:', error);
      toast({
        title: "Error",
        description: "Failed to update PDF metadata. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMetadataChange = (field: keyof PDFMetadata, value: string) => {
    setEditedMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetChanges = () => {
    setEditedMetadata({ ...currentMetadata });
  };

  const hasChanges = JSON.stringify(currentMetadata) !== JSON.stringify(editedMetadata);

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
              <div className="font-ms-sans">📋 PDF Metadata Editor</div>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Metadata Editor</h2>
              <p className="text-gray-600">View and edit PDF document metadata information</p>
            </div>

            {!fileName && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📋</div>
                  <div>
                    <label htmlFor="pdf-file" className="cursor-pointer">
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        Select PDF File to Edit Metadata
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
                      {fileName ? 'Updating PDF metadata...' : 'Loading PDF metadata...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {fileName && !isProcessing && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Editing: {fileName}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-black">Title</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Document title"
                        value={editedMetadata.title || ''}
                        onChange={(e) => handleMetadataChange('title', e.target.value)}
                        className="text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-black">Author</Label>
                      <Input
                        id="author"
                        type="text"
                        placeholder="Document author"
                        value={editedMetadata.author || ''}
                        onChange={(e) => handleMetadataChange('author', e.target.value)}
                        className="text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-black">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Document subject"
                        value={editedMetadata.subject || ''}
                        onChange={(e) => handleMetadataChange('subject', e.target.value)}
                        className="text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-black">Keywords</Label>
                      <Input
                        id="keywords"
                        type="text"
                        placeholder="Keywords (comma-separated)"
                        value={editedMetadata.keywords || ''}
                        onChange={(e) => handleMetadataChange('keywords', e.target.value)}
                        className="text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creator" className="text-black">Creator</Label>
                      <Input
                        id="creator"
                        type="text"
                        placeholder="Creator application"
                        value={editedMetadata.creator || ''}
                        onChange={(e) => handleMetadataChange('creator', e.target.value)}
                        className="text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="producer" className="text-black">Producer</Label>
                      <Input
                        id="producer"
                        type="text"
                        placeholder="Producer application"
                        value={editedMetadata.producer || ''}
                        onChange={(e) => handleMetadataChange('producer', e.target.value)}
                        className="text-black"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Creation date: {currentMetadata.creationDate || 'Not set'} (read-only)
                      <br />
                      Modification date will be automatically updated to current date when saving.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={resetChanges}
                    disabled={!hasChanges}
                    variant="outline"
                  >
                    🔄 Reset Changes
                  </Button>
                  <Button 
                    onClick={updateMetadata}
                    disabled={!hasChanges}
                    className="px-8"
                  >
                    💾 Save Metadata
                  </Button>
                  <Button 
                    onClick={() => {
                      setFileName('');
                      setCurrentMetadata({});
                      setEditedMetadata({});
                      setOriginalFile(null);
                    }}
                    variant="outline"
                  >
                    📁 Load Another PDF
                  </Button>
                </div>

                {hasChanges && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      ⚠️ You have unsaved changes. Click "Save Metadata" to download the updated PDF.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">📊 Metadata Features:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• View current PDF metadata information</li>
                <li>• Edit title, author, subject, and keywords</li>
                <li>• Update creator and producer information</li>
                <li>• Automatic modification date update</li>
                <li>• Download updated PDF with new metadata</li>
                <li>• Reset changes to original values</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Use Cases:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Add searchable keywords to PDF documents</li>
                <li>• Update author information for document tracking</li>
                <li>• Set proper titles for better organization</li>
                <li>• Add subject information for categorization</li>
                <li>• Document processing and workflow management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PdfMetadataEditor; 
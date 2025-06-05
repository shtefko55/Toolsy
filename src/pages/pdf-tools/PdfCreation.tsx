import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Win98Taskbar from '../../components/Win98Taskbar';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PdfCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [author, setAuthor] = useState('');

  const handleBackClick = () => {
    navigate('/pdf-tools');
  };

  const createPDF = async () => {
    if (!documentContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for the PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Set document metadata
      pdfDoc.setTitle(documentTitle || 'Created Document');
      pdfDoc.setAuthor(author || 'PDF Creator');
      pdfDoc.setSubject('Document created with PDF Tools');
      pdfDoc.setCreator('Retro PDF Creator');
      pdfDoc.setProducer('Retro PDF Creator');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Embed a font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Create a page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      const margin = 50;
      const maxWidth = width - 2 * margin;
      const lineHeight = 14;
      let yPosition = height - margin;

      // Add title if provided
      if (documentTitle) {
        page.drawText(documentTitle, {
          x: margin,
          y: yPosition,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 30;
      }

      // Add author if provided
      if (author) {
        page.drawText(`By: ${author}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 20;
      }

      // Add creation date
      page.drawText(`Created: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 30;

      // Split content into lines and pages
      const lines = documentContent.split('\n');
      let currentPage = page;

      for (const line of lines) {
        // Simple word wrapping
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, 12);
          
          if (textWidth > maxWidth && currentLine) {
            // Draw current line
            if (yPosition < margin + lineHeight) {
              // Need new page
              currentPage = pdfDoc.addPage([595.28, 841.89]);
              yPosition = height - margin;
            }
            
            currentPage.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: 12,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw remaining text
        if (currentLine) {
          if (yPosition < margin + lineHeight) {
            currentPage = pdfDoc.addPage([595.28, 841.89]);
            yPosition = height - margin;
          }
          
          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
        }
        
        // Extra space for paragraph breaks
        yPosition -= lineHeight / 2;
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();

      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle || 'created-document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `PDF "${documentTitle || 'created-document'}.pdf" has been created and downloaded.`,
      });

      // Reset form
      setDocumentTitle('');
      setDocumentContent('');
      setAuthor('');

    } catch (error) {
      console.error('Error creating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to create PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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
              <div className="font-ms-sans">📄 PDF Creation</div>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Create PDF Document</h2>
              <p className="text-gray-600">Create a professional PDF document from your text content</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-black">Document Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter document title..."
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="text-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-black">Author</Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="Enter author name..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="text-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-black">Document Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your document content here... 

You can write multiple paragraphs, and the PDF creator will handle:
- Automatic text wrapping
- Multiple pages when content is long
- Proper formatting and spacing

Start typing your content here!"
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                className="min-h-[300px] text-black"
              />
              <p className="text-sm text-gray-500">
                {documentContent.length} characters | Estimated pages: {Math.max(1, Math.ceil(documentContent.length / 2000))}
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={createPDF}
                disabled={isProcessing || !documentContent.trim()}
                className="px-8 py-2"
              >
                {isProcessing ? 'Creating PDF...' : '📄 Create PDF'}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Automatic text wrapping and pagination</li>
                <li>• Professional formatting with proper margins</li>
                <li>• Document metadata (title, author, creation date)</li>
                <li>• Support for long documents with multiple pages</li>
                <li>• Clean, readable font and layout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default PdfCreation; 
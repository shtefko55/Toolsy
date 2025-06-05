import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export interface PDFMergeOptions {
  files: File[];
  onProgress?: (progress: number) => void;
}

export interface PDFSplitOptions {
  file: File;
  pageRanges?: string;
  onProgress?: (progress: number) => void;
}

export interface PDFRotateOptions {
  file: File;
  rotation: number; // 90, 180, 270 degrees
  onProgress?: (progress: number) => void;
}

export interface PDFToImagesOptions {
  file: File;
  onProgress?: (progress: number) => void;
}

export class PDFProcessor {
  /**
   * Merge multiple PDF files into one
   */
  static async mergePDFs({ files, onProgress }: PDFMergeOptions): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      pages.forEach((page) => mergedPdf.addPage(page));
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    }
    
    return await mergedPdf.save();
  }

  /**
   * Split a PDF file into multiple files based on page ranges
   */
  static async splitPDF({ file, pageRanges, onProgress }: PDFSplitOptions): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    let ranges: number[][];
    
    if (pageRanges && pageRanges.trim()) {
      // Parse page ranges like "1-3, 5, 7-9"
      ranges = this.parsePageRanges(pageRanges, totalPages);
    } else {
      // Split each page individually
      ranges = Array.from({ length: totalPages }, (_, i) => [i]);
    }
    
    const splitPDFs: Uint8Array[] = [];
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, range);
      
      pages.forEach((page) => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      splitPDFs.push(pdfBytes);
      
      if (onProgress) {
        onProgress(((i + 1) / ranges.length) * 100);
      }
    }
    
    return splitPDFs;
  }

  /**
   * Rotate all pages in a PDF
   */
  static async rotatePDF({ file, rotation, onProgress }: PDFRotateOptions): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    
    pages.forEach((page, index) => {
      page.setRotation(degrees(rotation));
      
      if (onProgress) {
        onProgress(((index + 1) / pages.length) * 100);
      }
    });
    
    return await pdf.save();
  }

  /**
   * Convert images to PDF
   */
  static async imagesToPDF(files: File[], onProgress?: (progress: number) => void): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      
      let image;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        continue; // Skip unsupported formats
      }
      
      // Create page with image dimensions, but scale if too large
      const maxSize = 800; // Maximum dimension
      let { width, height } = image;
      
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width *= scale;
        height *= scale;
      }
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    }
    
    return await pdfDoc.save();
  }

  /**
   * Download a PDF file
   */
  static downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download multiple PDF files as a zip (simplified - just download individually)
   */
  static downloadMultiplePDFs(pdfFiles: Uint8Array[], baseFilename: string): void {
    pdfFiles.forEach((pdfBytes, index) => {
      const filename = `${baseFilename}_part_${index + 1}.pdf`;
      this.downloadPDF(pdfBytes, filename);
    });
  }

  /**
   * Convert PDF pages to actual images using PDF.js rendering
   */
  static async pdfToImages({ file, onProgress }: PDFToImagesOptions): Promise<string[]> {
    try {
      // Force worker configuration every time
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
      
      // Log version info for debugging
      console.log('PDF.js version:', pdfjsLib.version || 'unknown');
      console.log('Worker src:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      if (onProgress) onProgress(10);
      
      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Remove cMapUrl to avoid version conflicts
        verbosity: 0
      });
      
      if (onProgress) onProgress(20);
      
      const pdfDocument = await loadingTask.promise;
      const images: string[] = [];
      const totalPages = pdfDocument.numPages;
      
      if (onProgress) onProgress(30);
      
      // Convert each page to image
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          
          // Set up canvas for rendering
          const scale = 1.5; // Good quality while maintaining performance
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Cannot get canvas 2D context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render PDF page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          const renderTask = page.render(renderContext);
          await renderTask.promise;
          
          // Convert canvas to JPEG image
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          images.push(imageDataUrl);
          
          // Update progress
          if (onProgress) {
            const progress = 30 + ((pageNum / totalPages) * 70);
            onProgress(Math.round(progress));
          }
          
        } catch (pageError) {
          console.error(`Error rendering page ${pageNum}:`, pageError);
          // Create a fallback image for failed pages
          const canvas = document.createElement('canvas');
          canvas.width = 595;
          canvas.height = 842;
          const ctx = canvas.getContext('2d')!;
          
          ctx.fillStyle = '#f8f8f8';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#666';
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Page ${pageNum} - Rendering Error`, canvas.width / 2, canvas.height / 2);
          
          images.push(canvas.toDataURL('image/jpeg', 0.9));
        }
      }
      
      if (onProgress) onProgress(100);
      return images;
      
    } catch (error) {
      console.error('PDF to images conversion failed:', error);
      throw new Error(`Failed to convert PDF: ${error.message || 'Unknown error occurred'}`);
    }
  }

  /**
   * Download multiple images as individual files
   */
  static downloadMultipleImages(imageUrls: string[], baseFilename: string): void {
    imageUrls.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseFilename}_page_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL if it was created from a blob
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  /**
   * Parse page ranges like "1-3, 5, 7-9" into array of page indices
   */
  private static parsePageRanges(ranges: string, totalPages: number): number[][] {
    const result: number[][] = [];
    const parts = ranges.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (start && end && start <= totalPages && end <= totalPages && start <= end) {
          const range: number[] = [];
          for (let i = start - 1; i < end; i++) { // Convert to 0-based index
            range.push(i);
          }
          result.push(range);
        }
      } else {
        const pageNum = parseInt(part);
        if (pageNum && pageNum <= totalPages) {
          result.push([pageNum - 1]); // Convert to 0-based index
        }
      }
    }
    
    return result;
  }
} 
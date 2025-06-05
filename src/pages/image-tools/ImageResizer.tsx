import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, RotateCcw, Info, Link, Unlink } from 'lucide-react';

const ImageResizer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [newWidth, setNewWidth] = useState<string>('');
  const [newHeight, setNewHeight] = useState<string>('');
  const [isPercentage, setIsPercentage] = useState<boolean>(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      setNewWidth(img.width.toString());
      setNewHeight(img.height.toString());
      setResizedImage(null);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const resizeImage = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    let targetWidth: number;
    let targetHeight: number;

    if (isPercentage) {
      const widthPercent = parseFloat(newWidth) || 100;
      const heightPercent = parseFloat(newHeight) || 100;
      targetWidth = Math.round((originalWidth * widthPercent) / 100);
      targetHeight = Math.round((originalHeight * heightPercent) / 100);
    } else {
      targetWidth = parseInt(newWidth) || originalWidth;
      targetHeight = parseInt(newHeight) || originalHeight;
    }

    // Ensure minimum size
    targetWidth = Math.max(1, targetWidth);
    targetHeight = Math.max(1, targetHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
    
    const resizedDataUrl = canvas.toDataURL('image/png', 1.0);
    setResizedImage(resizedDataUrl);
    
    setIsProcessing(false);
  }, [originalImage, newWidth, newHeight, originalWidth, originalHeight, isPercentage]);

  const handleWidthChange = (value: string) => {
    setNewWidth(value);
    
    if (maintainAspectRatio && originalImage && value) {
      const width = isPercentage ? parseFloat(value) : parseInt(value);
      if (!isNaN(width) && width > 0) {
        const aspectRatio = originalHeight / originalWidth;
        const calculatedHeight = isPercentage 
          ? width 
          : Math.round(width * aspectRatio);
        setNewHeight(calculatedHeight.toString());
      }
    }
  };

  const handleHeightChange = (value: string) => {
    setNewHeight(value);
    
    if (maintainAspectRatio && originalImage && value) {
      const height = isPercentage ? parseFloat(value) : parseInt(value);
      if (!isNaN(height) && height > 0) {
        const aspectRatio = originalWidth / originalHeight;
        const calculatedWidth = isPercentage 
          ? height 
          : Math.round(height * aspectRatio);
        setNewWidth(calculatedWidth.toString());
      }
    }
  };

  const downloadResizedImage = () => {
    if (!resizedImage) return;

    const link = document.createElement('a');
    link.download = `resized_image_${newWidth}x${newHeight}.png`;
    link.href = resizedImage;
    link.click();

    toast({
      title: "Download Started",
      description: "Your resized image is being downloaded.",
    });
  };

  const resetTool = () => {
    setOriginalImage(null);
    setResizedImage(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setNewWidth('');
    setNewHeight('');
    setIsPercentage(false);
    setMaintainAspectRatio(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const swapDimensions = () => {
    const tempWidth = newWidth;
    setNewWidth(newHeight);
    setNewHeight(tempWidth);
  };

  const resetToOriginalSize = () => {
    if (originalImage) {
      setNewWidth(originalWidth.toString());
      setNewHeight(originalHeight.toString());
    }
  };

  const applyCommonSizes = (width: number, height: number) => {
    setNewWidth(width.toString());
    setNewHeight(height.toString());
  };

  return (
    <div className="min-h-screen bg-win98-desktop flex flex-col">
      <div className="flex-grow p-4">
        <div className="win98-window max-w-6xl mx-auto">
          <div className="win98-window-title">
            <div className="flex items-center gap-2">
              <button 
                className="win98-btn px-2 py-0.5 h-6 text-xs" 
                onClick={() => navigate('/image-tools')}
              >
                ← Back
              </button>
              <div className="font-ms-sans">📏 Image Resizer</div>
            </div>
            <div className="flex gap-1">
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">_</button>
              <button className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none">□</button>
              <button 
                onClick={() => navigate('/image-tools')} 
                className="bg-win98-gray text-win98-text w-5 h-5 flex items-center justify-center border border-win98-btnshadow leading-none hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Select an image to resize. Supports all common image formats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="win98-btn"
                  >
                    Choose File
                  </Button>
                  <Button onClick={resetTool} variant="secondary">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {originalImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Resize Settings</CardTitle>
                  <CardDescription>
                    Original size: {originalWidth} × {originalHeight} pixels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="percentage-mode"
                      checked={isPercentage}
                      onCheckedChange={setIsPercentage}
                    />
                    <Label htmlFor="percentage-mode">
                      Use percentage (%) instead of pixels
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aspect-ratio"
                      checked={maintainAspectRatio}
                      onCheckedChange={setMaintainAspectRatio}
                    />
                    <Label htmlFor="aspect-ratio" className="flex items-center gap-1">
                      {maintainAspectRatio ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                      Maintain aspect ratio
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Width {isPercentage ? '(%)' : '(pixels)'}
                      </Label>
                      <Input
                        type="number"
                        value={newWidth}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder={isPercentage ? "100" : originalWidth.toString()}
                        min={isPercentage ? "0.1" : "1"}
                        step={isPercentage ? "0.1" : "1"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Height {isPercentage ? '(%)' : '(pixels)'}
                      </Label>
                      <Input
                        type="number"
                        value={newHeight}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder={isPercentage ? "100" : originalHeight.toString()}
                        min={isPercentage ? "0.1" : "1"}
                        step={isPercentage ? "0.1" : "1"}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={resetToOriginalSize} 
                      variant="outline" 
                      size="sm"
                    >
                      Original Size
                    </Button>
                    <Button 
                      onClick={swapDimensions} 
                      variant="outline" 
                      size="sm"
                    >
                      Swap Dimensions
                    </Button>
                    <Button 
                      onClick={() => applyCommonSizes(800, 600)} 
                      variant="outline" 
                      size="sm"
                    >
                      800×600
                    </Button>
                    <Button 
                      onClick={() => applyCommonSizes(1920, 1080)} 
                      variant="outline" 
                      size="sm"
                    >
                      1920×1080
                    </Button>
                    <Button 
                      onClick={() => applyCommonSizes(1024, 768)} 
                      variant="outline" 
                      size="sm"
                    >
                      1024×768
                    </Button>
                  </div>

                  <Button
                    onClick={resizeImage}
                    className="win98-btn w-full"
                    disabled={!newWidth || !newHeight || isProcessing}
                  >
                    {isProcessing ? 'Resizing...' : 'Resize Image'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {originalImage && resizedImage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Original Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded border-2 border-gray-300">
                      <img
                        src={originalImage.src}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Dimensions: {originalWidth} × {originalHeight}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Resized Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded border-2 border-gray-300">
                      <img
                        src={resizedImage}
                        alt="Resized"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>New dimensions: {newWidth} × {newHeight}</div>
                    </div>
                    <Button
                      onClick={downloadResizedImage}
                      className="win98-btn mt-2 w-full"
                      disabled={!resizedImage}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resized
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Use percentage mode for proportional scaling (e.g., 50% = half size)</li>
                  <li>Maintain aspect ratio to prevent distortion of your image</li>
                  <li>Higher resolution images will have better quality when enlarged</li>
                  <li>Consider the final use case when choosing dimensions</li>
                  <li>All processing happens locally in your browser</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
      <Win98Taskbar />
    </div>
  );
};

export default ImageResizer; 
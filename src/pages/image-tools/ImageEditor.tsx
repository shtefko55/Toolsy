import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, RotateCcw, Info, Sun, Contrast, Palette2, Zap } from 'lucide-react';

const ImageEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState<number[]>([100]);
  const [contrast, setContrast] = useState<number[]>([100]);
  const [saturation, setSaturation] = useState<number[]>([100]);
  const [hue, setHue] = useState<number[]>([0]);
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
      
      // Initialize canvas
      if (canvasRef.current && previewCanvasRef.current) {
        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const previewCtx = previewCanvas.getContext('2d');
        
        if (ctx && previewCtx) {
          canvas.width = img.width;
          canvas.height = img.height;
          previewCanvas.width = img.width;
          previewCanvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          previewCtx.drawImage(img, 0, 0);
        }
      }
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const applyFilters = useCallback(() => {
    if (!originalImage || !canvasRef.current || !previewCanvasRef.current) return;

    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!ctx || !previewCtx) return;

    // Clear and redraw original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply filters
    const brightnessValue = brightness[0] / 100;
    const contrastValue = contrast[0] / 100;
    const saturationValue = saturation[0] / 100;
    const hueValue = (hue[0] * Math.PI) / 180;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      r = r * brightnessValue;
      g = g * brightnessValue;
      b = b * brightnessValue;
      
      // Apply contrast
      r = ((r / 255 - 0.5) * contrastValue + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrastValue + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrastValue + 0.5) * 255;
      
      // Convert to HSL for saturation and hue adjustment
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const diff = max - min;
      const sum = max + min;
      const l = sum / 2;
      
      if (diff !== 0) {
        const s = l < 0.5 ? diff / sum : diff / (2 - sum);
        let h = 0;
        
        if (max === r / 255) h = ((g - b) / 255) / diff + (g < b ? 6 : 0);
        else if (max === g / 255) h = ((b - r) / 255) / diff + 2;
        else h = ((r - g) / 255) / diff + 4;
        h /= 6;
        
        // Apply hue shift
        h = (h + hueValue / (2 * Math.PI)) % 1;
        
        // Apply saturation
        const newS = Math.max(0, Math.min(1, s * saturationValue));
        
        // Convert back to RGB
        const c = (1 - Math.abs(2 * l - 1)) * newS;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let newR = 0, newG = 0, newB = 0;
        
        if (h >= 0 && h < 1/6) { newR = c; newG = x; newB = 0; }
        else if (h >= 1/6 && h < 2/6) { newR = x; newG = c; newB = 0; }
        else if (h >= 2/6 && h < 3/6) { newR = 0; newG = c; newB = x; }
        else if (h >= 3/6 && h < 4/6) { newR = 0; newG = x; newB = c; }
        else if (h >= 4/6 && h < 5/6) { newR = x; newG = 0; newB = c; }
        else { newR = c; newG = 0; newB = x; }
        
        r = (newR + m) * 255;
        g = (newG + m) * 255;
        b = (newB + m) * 255;
      }
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    // Update preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.putImageData(imageData, 0, 0);
    
    setIsProcessing(false);
  }, [originalImage, brightness, contrast, saturation, hue]);

  useEffect(() => {
    if (originalImage) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, hue, applyFilters]);

  const downloadEditedImage = () => {
    if (!previewCanvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = previewCanvasRef.current.toDataURL('image/png', 1.0);
    link.click();

    toast({
      title: "Download Started",
      description: "Your edited image is being downloaded.",
    });
  };

  const resetFilters = () => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setHue([0]);
  };

  const resetTool = () => {
    setOriginalImage(null);
    resetFilters();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'vintage':
        setBrightness([110]);
        setContrast([120]);
        setSaturation([80]);
        setHue([10]);
        break;
      case 'cool':
        setBrightness([105]);
        setContrast([110]);
        setSaturation([120]);
        setHue([-10]);
        break;
      case 'warm':
        setBrightness([110]);
        setContrast([105]);
        setSaturation([110]);
        setHue([15]);
        break;
      case 'dramatic':
        setBrightness([95]);
        setContrast([140]);
        setSaturation([130]);
        setHue([0]);
        break;
      case 'soft':
        setBrightness([115]);
        setContrast([85]);
        setSaturation([90]);
        setHue([5]);
        break;
    }
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
              <div className="font-ms-sans">🎨 Basic Image Editor</div>
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
                  Select an image to edit. Adjust brightness, contrast, saturation, and hue.
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
                    Reset All
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
                  <CardTitle>Adjustment Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <Label>Brightness: {brightness[0]}%</Label>
                      </div>
                      <Slider
                        value={brightness}
                        onValueChange={setBrightness}
                        max={200}
                        min={0}
                        step={1}
                        className="slider-custom"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Contrast className="h-4 w-4" />
                        <Label>Contrast: {contrast[0]}%</Label>
                      </div>
                      <Slider
                        value={contrast}
                        onValueChange={setContrast}
                        max={200}
                        min={0}
                        step={1}
                        className="slider-custom"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette2 className="h-4 w-4" />
                        <Label>Saturation: {saturation[0]}%</Label>
                      </div>
                      <Slider
                        value={saturation}
                        onValueChange={setSaturation}
                        max={200}
                        min={0}
                        step={1}
                        className="slider-custom"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <Label>Hue: {hue[0]}°</Label>
                      </div>
                      <Slider
                        value={hue}
                        onValueChange={setHue}
                        max={180}
                        min={-180}
                        step={1}
                        className="slider-custom"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => applyPreset('vintage')} size="sm" variant="outline">
                        Vintage
                      </Button>
                      <Button onClick={() => applyPreset('cool')} size="sm" variant="outline">
                        Cool Tone
                      </Button>
                      <Button onClick={() => applyPreset('warm')} size="sm" variant="outline">
                        Warm Tone
                      </Button>
                      <Button onClick={() => applyPreset('dramatic')} size="sm" variant="outline">
                        Dramatic
                      </Button>
                      <Button onClick={() => applyPreset('soft')} size="sm" variant="outline">
                        Soft
                      </Button>
                      <Button onClick={resetFilters} size="sm" variant="outline">
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {originalImage && (
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Edited Image
                      {isProcessing && <span className="text-xs text-blue-600">Processing...</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded border-2 border-gray-300 relative">
                      <canvas
                        ref={previewCanvasRef}
                        className="w-full h-full object-contain"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    </div>
                    <Button
                      onClick={downloadEditedImage}
                      className="win98-btn mt-2 w-full"
                      disabled={!originalImage}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Edited Image
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  Editing Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Brightness:</strong> Increase to lighten image, decrease to darken</li>
                  <li><strong>Contrast:</strong> Higher values make lights lighter and darks darker</li>
                  <li><strong>Saturation:</strong> Adjust color intensity (0% = grayscale, 200% = very vivid)</li>
                  <li><strong>Hue:</strong> Shift the color spectrum (-180° to +180°)</li>
                  <li>Use presets as starting points, then fine-tune with individual controls</li>
                  <li>Changes are applied in real-time as you adjust the sliders</li>
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

export default ImageEditor; 
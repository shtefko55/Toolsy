import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Upload, RotateCcw, Info, Copy, Palette } from 'lucide-react';

interface ColorInfo {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  hex: string;
  hsl: string;
  hsv: string;
}

const ColorPicker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [selectedColors, setSelectedColors] = useState<ColorInfo[]>([]);
  const [currentColor, setCurrentColor] = useState<ColorInfo | null>(null);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [colorHistory, setColorHistory] = useState<ColorInfo[]>([]);

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
      setSelectedColors([]);
      setCurrentColor(null);
      
      // Draw image to canvas for pixel data access
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        }
      }
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const rgbToHsv = (r: number, g: number, b: number): string => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    return `hsv(${Math.round(h * 60)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingMode || !canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;
    
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    const colorInfo: ColorInfo = {
      x,
      y,
      r,
      g,
      b,
      hex: rgbToHex(r, g, b),
      hsl: rgbToHsl(r, g, b),
      hsv: rgbToHsv(r, g, b)
    };

    setCurrentColor(colorInfo);
    setSelectedColors(prev => [...prev, colorInfo]);
    setColorHistory(prev => {
      const newHistory = [colorInfo, ...prev.slice(0, 9)]; // Keep last 10
      return newHistory;
    });

    toast({
      title: "Color Picked!",
      description: `RGB(${r}, ${g}, ${b}) → ${colorInfo.hex}`,
    });
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${format} value copied to clipboard: ${text}`,
      });
    });
  };

  const clearColors = () => {
    setSelectedColors([]);
    setCurrentColor(null);
  };

  const resetTool = () => {
    setOriginalImage(null);
    setSelectedColors([]);
    setCurrentColor(null);
    setColorHistory([]);
    setIsPickingMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateColorPalette = () => {
    if (selectedColors.length === 0) return;

    const paletteData = selectedColors.map(color => ({
      color: color.hex,
      rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
      position: `${color.x}, ${color.y}`
    }));

    const cssVariables = paletteData.map((color, index) => 
      `  --color-${index + 1}: ${color.color};`
    ).join('\n');

    const cssCode = `:root {\n${cssVariables}\n}`;

    copyToClipboard(cssCode, 'CSS Color Palette');
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
              <div className="font-ms-sans">🎨 Color Picker from Image</div>
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
                  Select an image to pick colors from. Click anywhere on the image to extract color values.
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
                  <CardTitle>Color Picker Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsPickingMode(!isPickingMode)}
                      className={`win98-btn ${isPickingMode ? 'shadow-win98-in' : ''}`}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      {isPickingMode ? 'Stop Picking' : 'Start Picking'}
                    </Button>
                    <Button onClick={clearColors} variant="outline">
                      Clear Colors
                    </Button>
                    {selectedColors.length > 0 && (
                      <Button onClick={generateColorPalette} variant="outline">
                        Generate CSS Palette
                      </Button>
                    )}
                  </div>
                  
                  {isPickingMode && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      🎯 Click anywhere on the image below to pick a color
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {originalImage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <img
                        ref={imageRef}
                        src={originalImage.src}
                        alt="Original"
                        className={`w-full h-auto border-2 border-gray-300 rounded ${isPickingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                        onClick={handleImageClick}
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                      {isPickingMode && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none rounded">
                          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                            Click to pick color
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Color</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentColor ? (
                      <div className="space-y-3">
                        <div 
                          className="w-full h-16 rounded border-2 border-gray-300"
                          style={{ backgroundColor: currentColor.hex }}
                        />
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <Label>HEX:</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                value={currentColor.hex} 
                                readOnly 
                                className="w-24 text-xs"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(currentColor.hex, 'HEX')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label>RGB:</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                value={`${currentColor.r}, ${currentColor.g}, ${currentColor.b}`}
                                readOnly 
                                className="w-24 text-xs"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(`rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`, 'RGB')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label>HSL:</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                value={currentColor.hsl} 
                                readOnly 
                                className="w-24 text-xs"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(currentColor.hsl, 'HSL')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            Position: ({currentColor.x}, {currentColor.y})
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        {originalImage ? 'Click on the image to pick a color' : 'Upload an image first'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedColors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Color History ({selectedColors.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {selectedColors.map((color, index) => (
                      <div key={index} className="space-y-1">
                        <div 
                          className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => setCurrentColor(color)}
                          title={`Click to select: ${color.hex}`}
                        />
                        <div className="text-xs text-center text-gray-600 font-mono">
                          {color.hex}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Upload any image file (JPEG, PNG, WebP, etc.)</li>
                  <li>Click "Start Picking" to enable color selection mode</li>
                  <li>Click anywhere on the image to extract color values</li>
                  <li>Copy color values in HEX, RGB, or HSL format</li>
                  <li>Build a color palette and export as CSS variables</li>
                  <li>View your color history to reuse previously picked colors</li>
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

export default ColorPicker; 
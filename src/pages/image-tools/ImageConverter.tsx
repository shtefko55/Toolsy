import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, RotateCcw, Info, FileImage } from 'lucide-react';

const ImageConverter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('image/png');
  const [quality, setQuality] = useState<number[]>([90]);
  const [originalFormat, setOriginalFormat] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatOptions = [
    { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', supportsQuality: true },
    { value: 'image/png', label: 'PNG', extension: 'png', supportsQuality: false },
    { value: 'image/webp', label: 'WebP', extension: 'webp', supportsQuality: true },
    { value: 'image/bmp', label: 'BMP', extension: 'bmp', supportsQuality: false },
  ];

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

    setOriginalSize(file.size);
    setOriginalFormat(file.type);
    
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      convertImage(img, outputFormat, quality[0]);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [outputFormat, quality]);

  const convertImage = useCallback((img: HTMLImageElement, format: string, qualityValue: number) => {
    if (!img || !canvasRef.current) return;

    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    
    // For formats that don't support transparency, fill with white background
    if (format === 'image/jpeg' || format === 'image/bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(img, 0, 0);
    
    // Convert to target format
    const supportsQuality = formatOptions.find(f => f.value === format)?.supportsQuality;
    const convertedDataUrl = supportsQuality 
      ? canvas.toDataURL(format, qualityValue / 100)
      : canvas.toDataURL(format);
    
    setConvertedImage(convertedDataUrl);
    
    // Calculate converted size (approximate)
    const convertedBytes = Math.round((convertedDataUrl.length - convertedDataUrl.indexOf(',') - 1) * 3/4);
    setConvertedSize(convertedBytes);
    
    setIsProcessing(false);
  }, []);

  const handleFormatChange = useCallback((newFormat: string) => {
    setOutputFormat(newFormat);
    if (originalImage) {
      convertImage(originalImage, newFormat, quality[0]);
    }
  }, [originalImage, quality, convertImage]);

  const handleQualityChange = useCallback((newQuality: number[]) => {
    setQuality(newQuality);
    if (originalImage) {
      convertImage(originalImage, outputFormat, newQuality[0]);
    }
  }, [originalImage, outputFormat, convertImage]);

  const downloadConvertedImage = () => {
    if (!convertedImage) return;

    const formatInfo = formatOptions.find(f => f.value === outputFormat);
    const extension = formatInfo?.extension || 'png';
    
    const link = document.createElement('a');
    link.download = `converted_image.${extension}`;
    link.href = convertedImage;
    link.click();

    toast({
      title: "Download Started",
      description: `Your ${formatInfo?.label} image is being downloaded.`,
    });
  };

  const resetTool = () => {
    setOriginalImage(null);
    setConvertedImage(null);
    setOriginalSize(0);
    setConvertedSize(0);
    setOriginalFormat('');
    setOutputFormat('image/png');
    setQuality([90]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatLabel = (mimeType: string) => {
    const format = formatOptions.find(f => f.value === mimeType);
    return format?.label || mimeType.split('/')[1].toUpperCase();
  };

  const getSizeChange = () => {
    if (originalSize === 0 || convertedSize === 0) return 0;
    return Math.round(((convertedSize - originalSize) / originalSize) * 100);
  };

  const currentFormat = formatOptions.find(f => f.value === outputFormat);

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
              <div className="font-ms-sans">🔄 Image Format Converter</div>
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
                  Select an image to convert between formats. Supports JPEG, PNG, WebP, and BMP.
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
                  <CardTitle>Conversion Settings</CardTitle>
                  <CardDescription>
                    Converting from {getFormatLabel(originalFormat)} to {currentFormat?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formatOptions.map((format) => (
                        <button
                          key={format.value}
                          onClick={() => handleFormatChange(format.value)}
                          className={`win98-btn px-3 py-2 flex flex-col items-center gap-1 ${outputFormat === format.value ? 'shadow-win98-in' : ''}`}
                        >
                          <FileImage className="h-4 w-4" />
                          <span className="text-xs">{format.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentFormat?.supportsQuality && (
                    <div className="space-y-2">
                      <Label>Quality: {quality[0]}%</Label>
                      <Slider
                        value={quality}
                        onValueChange={handleQualityChange}
                        max={100}
                        min={1}
                        step={1}
                        className="slider-custom"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Lower quality = Smaller file</span>
                        <span>Higher quality = Better image</span>
                      </div>
                    </div>
                  )}

                  {!currentFormat?.supportsQuality && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      ℹ️ {currentFormat?.label} format doesn't support quality adjustment (lossless compression)
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {originalImage && convertedImage && (
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
                      <div>Format: {getFormatLabel(originalFormat)}</div>
                      <div>Size: {formatBytes(originalSize)}</div>
                      <div>Dimensions: {originalImage.width} × {originalImage.height}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Converted Image
                      {isProcessing && <span className="text-xs text-blue-600">Processing...</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded border-2 border-gray-300">
                      <img
                        src={convertedImage}
                        alt="Converted"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Format: {currentFormat?.label}</div>
                      <div>Size: {formatBytes(convertedSize)}</div>
                      <div className={`${getSizeChange() > 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                        Size change: {getSizeChange() > 0 ? '+' : ''}{getSizeChange()}%
                      </div>
                    </div>
                    <Button
                      onClick={downloadConvertedImage}
                      className="win98-btn mt-2 w-full"
                      disabled={!convertedImage}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {currentFormat?.label}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  Format Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-black mb-2">Best Use Cases:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>JPEG:</strong> Photos, complex images</li>
                      <li><strong>PNG:</strong> Graphics, logos, transparency</li>
                      <li><strong>WebP:</strong> Web use, modern browsers</li>
                      <li><strong>BMP:</strong> Uncompressed, editing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-2">Features:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Supports transparency: PNG, WebP</li>
                      <li>Quality adjustment: JPEG, WebP</li>
                      <li>Smallest files: WebP, JPEG</li>
                      <li>Universal support: JPEG, PNG</li>
                    </ul>
                  </div>
                </div>
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

export default ImageConverter; 
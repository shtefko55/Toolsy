import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Win98Taskbar from '../../components/Win98Taskbar';
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, RotateCcw, Info } from 'lucide-react';

const ImageCompressor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState<number[]>([80]);
  const [format, setFormat] = useState<string>('image/jpeg');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
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

    setOriginalSize(file.size);
    
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      compressImage(img, quality[0], format);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }, [quality, format]);

  const compressImage = useCallback((img: HTMLImageElement, qualityValue: number, outputFormat: string) => {
    if (!img || !canvasRef.current) return;

    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    const compressedDataUrl = canvas.toDataURL(outputFormat, qualityValue / 100);
    setCompressedImage(compressedDataUrl);
    
    const compressedBytes = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
    setCompressedSize(compressedBytes);
    
    setIsProcessing(false);
  }, []);

  const handleQualityChange = useCallback((newQuality: number[]) => {
    setQuality(newQuality);
    if (originalImage) {
      compressImage(originalImage, newQuality[0], format);
    }
  }, [originalImage, format, compressImage]);

  const handleFormatChange = useCallback((newFormat: string) => {
    setFormat(newFormat);
    if (originalImage) {
      compressImage(originalImage, quality[0], newFormat);
    }
  }, [originalImage, quality, compressImage]);

  const downloadCompressedImage = () => {
    if (!compressedImage) return;

    const link = document.createElement('a');
    link.download = `compressed_image.${format === 'image/jpeg' ? 'jpg' : format.split('/')[1]}`;
    link.href = compressedImage;
    link.click();

    toast({
      title: "Download Started",
      description: "Your compressed image is being downloaded.",
    });
  };

  const resetTool = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setQuality([80]);
    setFormat('image/jpeg');
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

  const getCompressionRatio = () => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
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
              <div className="font-ms-sans">🗜️ Image Compressor</div>
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
                  Select an image to compress. Supports JPEG, PNG, WebP formats.
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
                  <CardTitle>Compression Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <div className="flex gap-2">
                      {['image/jpeg', 'image/png', 'image/webp'].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => handleFormatChange(fmt)}
                          className={`win98-btn px-3 py-1 ${format === fmt ? 'shadow-win98-in' : ''}`}
                        >
                          {fmt.split('/')[1].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {format !== 'image/png' && (
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
                        <span>Higher quality = Larger file</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {originalImage && compressedImage && (
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
                      <div>Size: {formatBytes(originalSize)}</div>
                      <div>Dimensions: {originalImage.width} × {originalImage.height}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Compressed Image
                      {isProcessing && <span className="text-xs text-blue-600">Processing...</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded border-2 border-gray-300">
                      <img
                        src={compressedImage}
                        alt="Compressed"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Size: {formatBytes(compressedSize)}</div>
                      <div className="text-green-600 font-medium">
                        Reduced by: {getCompressionRatio()}%
                      </div>
                    </div>
                    <Button
                      onClick={downloadCompressedImage}
                      className="win98-btn mt-2 w-full"
                      disabled={!compressedImage}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Compressed
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>JPEG:</strong> Best for photos, supports quality adjustment</li>
                  <li><strong>PNG:</strong> Best for graphics with transparency, lossless</li>
                  <li><strong>WebP:</strong> Modern format with better compression</li>
                  <li>Lower quality = smaller file size but reduced image quality</li>
                  <li>All processing happens in your browser - no uploads to servers</li>
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

export default ImageCompressor; 
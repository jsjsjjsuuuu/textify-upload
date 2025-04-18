import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCw, Download, Loader2, Maximize2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImageData } from '@/types/ImageData';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  image: ImageData;
  onClose: () => void;
  nextImage?: () => void;
  prevImage?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const ImageViewer = ({ 
  image,
  onClose,
  nextImage,
  prevImage,
  hasNext,
  hasPrev
}: ImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    setIsLoading(true);
    const img = new Image();
    img.src = image.dataUrl || image.previewUrl || "";
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
  }, [image.dataUrl, image.previewUrl]);

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.3));
  };

  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.dataUrl || image.previewUrl || "";
    link.download = image.fileName || "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center justify-between bg-background/10 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-background/20 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevImage}
            disabled={!hasPrev}
            className={cn(
              "rounded-full hover:bg-background/20 text-white",
              !hasPrev && "opacity-50 cursor-not-allowed"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={nextImage}
            disabled={!hasNext}
            className={cn(
              "rounded-full hover:bg-background/20 text-white",
              !hasNext && "opacity-50 cursor-not-allowed"
            )}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-grow relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.img
              src={image.dataUrl || image.previewUrl || ""}
              alt={image.fileName || "Image"}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease-in-out',
              }}
              className="max-w-full max-h-full object-contain"
              ref={imageRef}
            />
          </motion.div>
        )}
      </div>
      
      {/* Bottom toolbar */}
      <div className="px-4 py-2 flex items-center space-x-2 bg-background/10 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="rounded-full hover:bg-background/20 text-white"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="rounded-full hover:bg-background/20 text-white"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRotate}
          className="rounded-full hover:bg-background/20 text-white"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="rounded-full hover:bg-background/20 text-white"
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ImageViewer;

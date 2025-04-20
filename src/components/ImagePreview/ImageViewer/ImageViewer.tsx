import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageData } from '@/types/ImageData';
import ImageErrorDisplay from './ImageErrorDisplay';
import ZoomControls from './ZoomControls';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ImageViewerProps {
  image: ImageData;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomChange: (zoom: number) => void;
  formatDate: (date: Date) => string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onRetry?: (imageId: string) => void;
  onDelete?: (imageId: string) => void;
  compact?: boolean;
}

export const ImageViewer = ({
  image,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  formatDate,
  isFullScreen,
  onToggleFullScreen,
  onRetry,
  onDelete,
  compact = false
}: ImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    console.log("تحديث صورة في العارض:", image.id);
  }, [image.id, image.previewUrl]);

  const hasValidUrl = image.previewUrl && (
    image.previewUrl.startsWith('data:') || 
    image.previewUrl.startsWith('blob:') || 
    image.previewUrl.startsWith('http')
  );

  const handleImageLoad = () => {
    console.log("تم تحميل الصورة بنجاح في العارض:", image.id);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("خطأ في تحميل الصورة في العارض:", image.id);
    setImageError(true);
    setImageLoaded(false);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom * 1.2, 3);
    setCurrentZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom / 1.2, 0.5);
    setCurrentZoom(newZoom);
  };

  const handleResetZoom = () => {
    setCurrentZoom(1);
  };

  const ImageContent = () => (
    <div className={cn(
      "relative group bg-gray-900/95 rounded-lg overflow-hidden",
      compact ? "h-24" : "h-[80vh] w-full"
    )}>
      {hasValidUrl ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {imageError && (
            <ImageErrorDisplay 
              onRetry={onRetry ? () => {
                setRetryCount(prev => prev + 1);
                setImageError(false);
                setImageLoaded(false);
                onRetry(image.id);
              } : undefined}
              retryCount={retryCount} 
            />
          )}
          
          <div 
            className="relative w-full h-full overflow-hidden cursor-zoom-in"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <img
              src={hasValidUrl ? `${image.previewUrl}${retryCount > 0 ? `?v=${retryCount}` : ''}` : ''}
              alt={`صورة ${image.number || ""}`}
              className={cn(
                "w-full h-full object-contain transition-transform duration-300 ease-out",
                !imageLoaded && "opacity-0",
                imageLoaded && "opacity-100"
              )}
              style={{ 
                transform: `scale(${currentZoom})`,
                transformOrigin: 'center center'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />

            {/* أزرار التحكم */}
            <div className={cn(
              "absolute top-4 right-4 flex gap-2 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                  className="bg-red-500/90 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-800/90 hover:bg-gray-700"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* عناصر التحكم في التكبير */}
            <div className={cn(
              "absolute bottom-4 right-4 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}>
              <ZoomControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                zoomLevel={currentZoom}
              />
            </div>
          </div>
        </div>
      ) : (
        <ImageErrorDisplay 
          errorMessage="لا يوجد مصدر للصورة"
          onRetry={onRetry ? () => onRetry(image.id) : undefined}
        />
      )}
      
      {/* معلومات الصورة */}
      {!compact && hasValidUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
          {image.date && <span>{formatDate(image.date)}</span>}
          {image.number && <span className="mr-2">#{image.number}</span>}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <ImageContent />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <ImageContent />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageViewer;

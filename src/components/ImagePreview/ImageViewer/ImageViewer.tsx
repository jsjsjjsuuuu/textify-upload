
import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageData } from '@/types/ImageData';
import ImageErrorDisplay from './ImageErrorDisplay';
import ZoomControls from './ZoomControls';

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

  return (
    <div className={cn(
      "relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden",
      compact ? "h-24" : "h-[600px] w-full"
    )}>
      {hasValidUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
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
          
          <div className="relative w-full h-full overflow-hidden">
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
            
            {!compact && (
              <div className="absolute bottom-4 right-4 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary"
                  size="icon"
                  className="bg-gray-900/80 hover:bg-gray-800 w-10 h-10"
                  onClick={onZoomIn}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button 
                  variant="secondary"
                  size="icon"
                  className="bg-gray-900/80 hover:bg-gray-800 w-10 h-10"
                  onClick={onZoomOut}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                {onToggleFullScreen && (
                  <Button 
                    variant="secondary"
                    size="icon"
                    className="bg-gray-900/80 hover:bg-gray-800 w-10 h-10"
                    onClick={onToggleFullScreen}
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className={cn(
            "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
            "flex items-center justify-center gap-2"
          )}>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(image.id)}
                className="text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {(image.status === 'error' || imageError) && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRetry(image.id)}
                className="text-yellow-500 hover:bg-yellow-500/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ImageErrorDisplay 
          errorMessage="لا يوجد مصدر للصورة"
          onRetry={onRetry ? () => onRetry(image.id) : undefined}
        />
      )}
      
      {!compact && hasValidUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
          {image.date && <span>{formatDate(image.date)}</span>}
          {image.number && <span className="mr-2">#{image.number}</span>}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;


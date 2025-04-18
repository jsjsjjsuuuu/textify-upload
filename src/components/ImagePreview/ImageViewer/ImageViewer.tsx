
import React, { useState, useEffect } from 'react';
import { Trash2, ZoomIn, ZoomOut, RefreshCw, Maximize2, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageData } from '@/types/ImageData';

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
  // استخدام state لتتبع حالة تحميل الصورة
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // إعادة ضبط حالة الصورة عندما تتغير الصورة
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [image.id, image.previewUrl]);

  // التعامل مع تحميل الصورة
  const handleImageLoad = () => {
    console.log("تم تحميل الصورة بنجاح:", image.id);
    setImageLoaded(true);
    setImageError(false);
  };

  // التعامل مع خطأ الصورة
  const handleImageError = () => {
    console.error("خطأ في تحميل الصورة:", image.id);
    setImageError(true);
    setImageLoaded(false);
  };

  // التعامل مع إعادة التحميل
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetry) {
      onRetry(image.id);
    }
  };

  return (
    <div className={cn(
      "relative group bg-black/20 rounded-lg overflow-hidden",
      compact ? "h-24" : "h-full"
    )}>
      {/* عرض الصورة */}
      {image.previewUrl && (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
              <MinusCircle className="h-12 w-12 mb-2" />
              <p className="text-sm">خطأ في تحميل الصورة</p>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="mt-2"
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          )}
          
          <img
            src={image.previewUrl}
            alt={`صورة ${image.number || ""}`}
            className={cn(
              "w-full h-full object-contain transition-transform",
              compact ? "hover:scale-105" : "",
              !imageLoaded && "opacity-0",
              imageLoaded && "opacity-100"
            )}
            style={{ transform: `scale(${zoomLevel})` }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* أزرار التحكم */}
          <div className={cn(
            "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
            "flex items-center justify-center gap-2"
          )}>
            {!compact && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomIn}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomOut}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                className="text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {image.status === 'error' && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRetry}
                className="text-yellow-500 hover:bg-yellow-500/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {onToggleFullScreen && !compact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFullScreen();
                }}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* معلومات الصورة */}
      {!compact && image.previewUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
          {image.date && <span>{formatDate(image.date)}</span>}
          {image.number && <span className="mr-2">#{image.number}</span>}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;

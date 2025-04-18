
import React, { useState, useEffect } from 'react';
import { Trash2, ZoomIn, ZoomOut, RefreshCw, Maximize2, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageData } from '@/types/ImageData';
import ImageErrorDisplay from './ImageErrorDisplay';

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
  const [retryCount, setRetryCount] = useState(0);

  // إعادة ضبط حالة الصورة عندما تتغير الصورة
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    console.log("تحديث صورة في العارض:", image.id);
  }, [image.id, image.previewUrl]);

  // التحقق إذا كان لدينا URL صالح للعرض
  const hasValidUrl = image.previewUrl && (
    image.previewUrl.startsWith('data:') || 
    image.previewUrl.startsWith('blob:') || 
    image.previewUrl.startsWith('http')
  );

  // التعامل مع تحميل الصورة
  const handleImageLoad = () => {
    console.log("تم تحميل الصورة بنجاح في العارض:", image.id);
    setImageLoaded(true);
    setImageError(false);
  };

  // التعامل مع خطأ الصورة
  const handleImageError = () => {
    console.error("خطأ في تحميل الصورة في العارض:", image.id, "URL:", image.previewUrl?.substring(0, 50));
    setImageError(true);
    setImageLoaded(false);
  };

  // التعامل مع إعادة التحميل
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(prev => prev + 1);
    setImageError(false);
    setImageLoaded(false);
    console.log("محاولة إعادة تحميل الصورة في العارض:", image.id);
    if (onRetry) {
      onRetry(image.id);
    }
  };

  // التعامل مع الحذف
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("طلب حذف الصورة:", image.id);
    if (onDelete) {
      onDelete(image.id);
    }
  };

  return (
    <div className={cn(
      "relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden",
      compact ? "h-24" : "h-full"
    )}>
      {/* عرض الصورة */}
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
            />
          )}
          
          <img
            src={hasValidUrl ? `${image.previewUrl}${retryCount > 0 ? `?v=${retryCount}` : ''}` : ''}
            alt={`صورة ${image.number || ""}`}
            className={cn(
              "w-full h-full object-contain transition-transform duration-300",
              compact ? "hover:scale-105" : "",
              !imageLoaded && "opacity-0",
              imageLoaded && "opacity-100"
            )}
            style={{ transform: `scale(${zoomLevel})` }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
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
                onClick={handleDelete}
                className="text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {(image.status === 'error' || imageError) && onRetry && (
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
};

export default ImageViewer;

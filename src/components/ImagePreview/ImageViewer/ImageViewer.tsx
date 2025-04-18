
import React from 'react';
import { Trash2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
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
  return (
    <div className={cn(
      "relative group bg-black/20 rounded-lg overflow-hidden",
      compact ? "h-24" : "h-full"
    )}>
      {/* صورة العرض */}
      {image.previewUrl && (
        <div className="relative w-full h-full">
          <img
            src={image.previewUrl}
            alt={`صورة ${image.number || ""}`}
            className={cn(
              "w-full h-full object-contain transition-transform",
              compact ? "hover:scale-105" : ""
            )}
            style={{ transform: `scale(${zoomLevel})` }}
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
                onClick={() => onDelete(image.id)}
                className="text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {image.status === 'error' && onRetry && (
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
      )}
      
      {/* معلومات الصورة */}
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
          {image.date && <span>{formatDate(image.date)}</span>}
          {image.number && <span className="mr-2">#{image.number}</span>}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;

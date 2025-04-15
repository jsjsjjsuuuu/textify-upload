
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// تحديث واجهة ImageViewerProps لتشمل خصائص التكبير والتصغير
interface ImageViewerProps {
  image: ImageData;
  onTextChange?: (id: string, field: string, value: string) => void;
  onSubmit?: (id: string) => Promise<boolean>;
  isSubmitting?: boolean;
  // إضافة خصائص التكبير والتصغير
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onZoomChange?: (newZoom: number) => void;
  formatDate?: (date: Date) => string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onRetry?: (imageId: string) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onTextChange,
  onSubmit,
  isSubmitting = false,
  // إضافة الخصائص الجديدة مع قيم افتراضية
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomChange,
  formatDate,
  isFullScreen = false,
  onToggleFullScreen,
  onRetry
}) => {
  // إضافة عناصر التحكم بالتكبير والتصغير إذا كانت متوفرة
  const renderZoomControls = () => {
    if (!onZoomIn || !onZoomOut || !onResetZoom) return null;
    
    return (
      <div className="absolute top-2 right-2 flex space-x-1 bg-black/50 rounded-md p-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white"
          onClick={onZoomIn}
          title="تكبير"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white"
          onClick={onZoomOut}
          title="تصغير"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white"
          onClick={onResetZoom}
          title="إعادة ضبط"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        {onToggleFullScreen && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white"
            onClick={onToggleFullScreen}
            title="ملء الشاشة"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  // إضافة زر إعادة المحاولة إذا كانت هناك أخطاء وتم توفير دالة onRetry
  const renderRetryButton = () => {
    if (!onRetry || image.status !== 'error') return null;
    
    return (
      <div className="absolute bottom-2 right-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRetry(image.id)}
          className="bg-red-600 hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          إعادة المعالجة
        </Button>
      </div>
    );
  };

  // تحديث عرض الصورة ليتضمن عناصر التحكم بالتكبير
  return (
    <div className="relative h-full">
      {/* عرض الصورة مع تطبيق مستوى التكبير */}
      {image.previewUrl ? (
        <div className="relative h-full overflow-hidden flex items-center justify-center bg-[#0a0f1e]">
          <img 
            src={image.previewUrl} 
            alt={`صورة ${image.code || ""}`} 
            className="max-h-full max-w-full object-contain"
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}
          />
          {renderZoomControls()}
          {renderRetryButton()}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full bg-[#0a0f1e]">
          <p className="text-gray-400">لا توجد صورة متاحة للعرض</p>
          {renderRetryButton()}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;

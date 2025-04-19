
import React, { useState, useEffect } from 'react';
import { ImageData } from "@/types/ImageData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ZoomIn, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
  compact?: boolean;
  onRetryLoad?: (imageId: string) => void;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
  image, 
  onImageClick, 
  formatDate,
  compact = false,
  onRetryLoad
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // إعادة تعيين حالة الصورة عند تغيير مصدر الصورة
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    console.log("تحديث صورة:", image.id, "URL:", image.previewUrl?.substring(0, 50));
  }, [image.id, image.previewUrl]);

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(prev => prev + 1);
    setImageError(false);
    setImageLoaded(false);
    console.log("محاولة إعادة تحميل الصورة:", image.id);
    if (onRetryLoad) {
      onRetryLoad(image.id);
    }
  };

  const handleImageLoad = () => {
    console.log("تم تحميل الصورة بنجاح:", image.id);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("خطأ في تحميل الصورة:", image.id, "URL:", image.previewUrl?.substring(0, 50));
    setImageError(true);
    setImageLoaded(false);
  };

  // للتحقق إذا كان لدينا URL صالح للعرض
  const hasValidUrl = image.previewUrl && (
    image.previewUrl.startsWith('data:') || 
    image.previewUrl.startsWith('blob:') || 
    image.previewUrl.startsWith('http')
  );

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden cursor-pointer group border border-gray-200 dark:border-gray-700 rounded-lg",
        compact ? "h-24" : "h-[200px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onImageClick(image)}
    >
      {/* عرض حالة تحميل الصورة */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* عرض خطأ الصورة */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-gray-100 dark:bg-gray-800">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-xs">خطأ في الصورة</p>
          {onRetryLoad && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryClick}
              className="mt-2 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              إعادة المحاولة
            </Button>
          )}
        </div>
      )}
      
      {/* عرض الصورة */}
      {hasValidUrl && (
        <img 
          src={`${image.previewUrl}${retryCount > 0 ? `?v=${retryCount}` : ''}`}
          alt="صورة محملة" 
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300", 
            compact && "object-cover",
            !imageLoaded && "opacity-0",
            imageLoaded && "opacity-100"
          )}
          style={{ mixBlendMode: 'multiply' }} 
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {/* معلومات الصورة */}
      <div className={cn(
        "absolute top-1 left-1 bg-brand-brown text-white px-2 py-1 rounded-full",
        compact ? "text-xs" : "text-xs"
      )}>
        صورة {image.number || '#'}
      </div>
      
      {/* حالة المعالجة */}
      {image.status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <span className={cn(
            "text-xs", 
            compact && "text-[10px]"
          )}>جاري المعالجة...</span>
        </div>
      )}
      
      {/* أيقونات الحالة */}
      <div className={cn(
        "absolute top-1 right-1",
        compact && "scale-75"
      )}>
        {image.status === "completed" && (
          <div className="bg-green-500 text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
        {image.status === "error" && (
          <div className="bg-destructive text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
      
      {/* زر إعادة المحاولة للصور التي بها خطأ */}
      {(image.status === "error" || imageError) && onRetryLoad && (
        <div 
          className="absolute bottom-1 right-1 bg-white/90 p-1 rounded-full cursor-pointer"
          onClick={handleRetryClick}
        >
          <RefreshCw className="h-4 w-4 text-destructive" />
        </div>
      )}
      
      {/* تأثير التكبير عند التحويم */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/20 flex items-center justify-center"
      >
        <div className="bg-white/90 p-2 rounded-full">
          <ZoomIn size={compact ? 16 : 24} className="text-brand-brown" />
        </div>
      </motion.div>
    </div>
  );
};

export default DraggableImage;

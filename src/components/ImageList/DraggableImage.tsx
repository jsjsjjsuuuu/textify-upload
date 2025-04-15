
import React, { useState } from 'react';
import { ImageData } from "@/types/ImageData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";

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

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetryLoad && image.status === 'error') {
      onRetryLoad(image.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden cursor-pointer group",
        compact ? "h-24" : "h-[200px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onImageClick(image)}
    >
      <img 
        src={image.previewUrl} 
        alt="صورة محملة" 
        className={cn(
          "w-full h-full object-contain", 
          compact && "object-cover"
        )}
        style={{ mixBlendMode: 'multiply' }} 
      />
      
      {/* معلومات الصورة */}
      <div className={cn(
        "absolute top-1 left-1 bg-brand-brown text-white px-2 py-1 rounded-full",
        compact ? "text-xs" : "text-xs"
      )}>
        صورة {image.number}
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
            {/* رمز اكتمال */}
          </div>
        )}
        {image.status === "error" && (
          <div className="bg-destructive text-white p-1 rounded-full">
            {/* رمز الخطأ */}
          </div>
        )}
      </div>
      
      {/* زر إعادة المحاولة للصور التي بها خطأ */}
      {image.status === "error" && onRetryLoad && (
        <div 
          className="absolute bottom-1 right-1 bg-white/90 p-1 rounded-full cursor-pointer"
          onClick={handleRetryClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M8 16H3v5"></path>
          </svg>
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

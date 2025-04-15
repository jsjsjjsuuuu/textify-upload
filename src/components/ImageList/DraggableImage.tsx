
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
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
  image, 
  onImageClick, 
  formatDate,
  compact = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

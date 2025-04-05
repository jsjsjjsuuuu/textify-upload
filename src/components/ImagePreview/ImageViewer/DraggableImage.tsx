
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

interface DraggableImageProps {
  src: string | null;
  zoomLevel: number;
  onImageLoad: () => void;
  onImageError: () => void;
  imageLoaded: boolean;
}

const DraggableImage = ({
  src,
  zoomLevel,
  onImageLoad,
  onImageError,
  imageLoaded
}: DraggableImageProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragEnabled, setDragEnabled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // إعادة تعيين الموضع عند تغيير المصدر أو إعادة تعيين التكبير
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setImageError(false);
  }, [src, zoomLevel === 1]);

  // تمكين السحب فقط عندما يكون مستوى التكبير أكبر من 1
  useEffect(() => {
    setDragEnabled(zoomLevel > 1);
  }, [zoomLevel]);

  // معالجة الأخطاء المتكررة
  const handleImageError = useCallback(() => {
    setImageError(true);
    onImageError();
  }, [onImageError]);

  // معالجة تحميل الصورة
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    onImageLoad();
  }, [onImageLoad]);

  if (!src) {
    return (
      <div className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 h-[550px] w-full rounded-md">
        <div className="text-center text-gray-500 dark:text-gray-400">
          لا توجد صورة متاحة
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={imageContainerRef}
      className="overflow-hidden relative h-[550px] w-full flex items-center justify-center bg-transparent rounded-md"
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="mt-2">تعذر تحميل الصورة</p>
          </div>
        </div>
      )}
      
      <motion.div
        drag={dragEnabled}
        dragConstraints={imageContainerRef}
        dragElastic={0.05}
        dragMomentum={false}
        animate={position}
        onDragEnd={(_, info) => {
          setPosition(prevPos => ({
            x: prevPos.x + info.offset.x,
            y: prevPos.y + info.offset.y
          }));
        }}
        className="relative w-fit h-fit"
        style={{ touchAction: "none" }}
      >
        <img
          ref={imageRef}
          src={src}
          alt="معاينة الصورة"
          className={`max-h-[550px] max-w-full object-contain transition-transform cursor-${dragEnabled ? 'grab active:cursor-grabbing' : 'default'}`}
          style={{ 
            transform: `scale(${zoomLevel})`,
            opacity: imageLoaded && !imageError ? 1 : 0,
            transition: "opacity 300ms ease-in-out, transform 200ms ease-out"
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </motion.div>
    </div>
  );
};

export default DraggableImage;

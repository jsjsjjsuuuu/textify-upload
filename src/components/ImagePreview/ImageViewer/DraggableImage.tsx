
import React, { useState, useEffect, useRef } from "react";
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
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset position when src changes or on zoom reset
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [src, zoomLevel === 1]);

  // Enable drag only when zoom level is greater than 1
  useEffect(() => {
    setDragEnabled(zoomLevel > 1);
  }, [zoomLevel]);

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
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader className="w-12 h-12 text-gray-400 animate-spin" />
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
          src={src}
          alt="معاينة الصورة"
          className={`max-h-[550px] max-w-full object-contain transition-transform cursor-${dragEnabled ? 'grab active:cursor-grabbing' : 'default'}`}
          style={{ 
            transform: `scale(${zoomLevel})`,
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 300ms ease-in-out, transform 200ms ease-out"
          }}
          onLoad={onImageLoad}
          onError={onImageError}
          draggable={false}
        />
      </motion.div>
    </div>
  );
};

export default DraggableImage;

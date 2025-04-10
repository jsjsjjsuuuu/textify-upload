
import React, { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { ZoomIn, ZoomOut, RefreshCw, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ReceiptImageProps {
  image: ImageData;
  isZoomed: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const ReceiptImage: React.FC<ReceiptImageProps> = ({
  image,
  isZoomed,
  onClick,
  onDoubleClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState(isZoomed ? 1.5 : 1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // إعادة تعيين الموضع عند تغيير وضع التكبير
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(isZoomed ? 1.5 : 1);
  }, [isZoomed]);

  // وظائف التكبير والتصغير
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(isZoomed ? 1.5 : 1);
    setPosition({ x: 0, y: 0 });
  };

  // حساب حدود الحركة بناءً على حجم الصورة ومستوى التكبير
  const calculateBounds = () => {
    if (!imageRef.current || !imageContainerRef.current) return { maxX: 0, maxY: 0 };
    
    const containerWidth = imageContainerRef.current.clientWidth;
    const containerHeight = imageContainerRef.current.clientHeight;
    const imageWidth = imageRef.current.naturalWidth * zoomLevel;
    const imageHeight = imageRef.current.naturalHeight * zoomLevel;
    
    const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
    const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
    
    return { maxX, maxY };
  };

  // معالجة سحب الصورة
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    const { maxX, maxY } = calculateBounds();
    
    const boundedX = Math.min(Math.max(newX, -maxX), maxX);
    const boundedY = Math.min(Math.max(newY, -maxY), maxY);
    
    requestAnimationFrame(() => {
      setPosition({ x: boundedX, y: boundedY });
    });
    
    e.preventDefault();
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  // معالجة الأجهزة اللوحية واللمس
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isZoomed) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && isZoomed) {
      const newX = e.touches[0].clientX - startPos.x;
      const newY = e.touches[0].clientY - startPos.y;
      
      const { maxX, maxY } = calculateBounds();
      
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);
      
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
      
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <div
      ref={imageContainerRef}
      className={`relative overflow-hidden bg-black flex items-center justify-center
        ${isZoomed ? 'h-[calc(100vh-180px)]' : 'h-[420px]'}
        ${isZoomed ? 'cursor-move' : 'cursor-zoom-in'}
        rounded-lg border border-purple-800/30`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* أزرار التكبير والتصغير */}
      {isZoomed && (
        <div className="absolute top-2 left-2 z-20 flex gap-2">
          <Button variant="secondary" size="icon" onClick={handleZoomIn} className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white">
            <ZoomIn size={16} />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleZoomOut} className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white">
            <ZoomOut size={16} />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleResetZoom} className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white">
            <RefreshCw size={16} />
          </Button>
        </div>
      )}
      
      {/* عرض نسبة التكبير */}
      {isZoomed && (
        <div className="absolute bottom-2 left-2 z-20 bg-black/60 text-white px-2 py-1 rounded text-xs">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}

      {/* تعليمات الاستخدام */}
      {isZoomed && zoomLevel > 1.2 && (
        <div className="absolute bottom-2 right-2 z-20 bg-black/60 text-white px-3 py-1.5 rounded text-xs max-w-48">
          اسحب الصورة للتنقل بين أجزائها
        </div>
      )}
      
      {/* صورة الوصل */}
      {!imgError && image.previewUrl ? (
        <motion.img
          ref={imageRef}
          src={image.previewUrl}
          alt={`وصل ${image.code || ''}`}
          className={`max-h-full max-w-full object-contain ${isZoomed ? '' : 'hover:opacity-90'}`}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onError={handleImageError}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Maximize className="w-12 h-12 mb-2" />
          <p>لا يمكن عرض الصورة</p>
        </div>
      )}
      
      {/* إطار بنفسجي حول الصورة عند التكبير */}
      {isZoomed && (
        <div className="absolute inset-0 pointer-events-none border-8 border-purple-600/30 rounded-lg" />
      )}
    </div>
  );
};

export default ReceiptImage;

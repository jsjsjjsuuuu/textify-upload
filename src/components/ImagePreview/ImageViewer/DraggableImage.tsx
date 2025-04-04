
import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface DraggableImageProps {
  src: string | null;
  zoomLevel: number;
  onImageLoad: () => void;
  onImageError: () => void;
  imageLoaded: boolean;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
  src, 
  zoomLevel,
  onImageLoad,
  onImageError,
  imageLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // معالجة الأحداث اللمسية
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setStartPos({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - startPos.x,
      y: touch.clientY - startPos.y
    });
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // إعادة تعيين الموضع عند تغيير الصورة أو مستوى التكبير
  React.useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [src, zoomLevel]);
  
  return (
    <div 
      className="relative overflow-hidden h-[550px] w-full flex items-center justify-center bg-transparent rounded-md"
      ref={containerRef}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {src && (
        <div
          className="absolute cursor-grab overflow-visible"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={src}
            alt="معاينة الصورة"
            className="max-h-[500px] max-w-full pointer-events-none"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s',
              opacity: imageLoaded ? 1 : 0,
            }}
            onLoad={onImageLoad}
            onError={onImageError}
          />
        </div>
      )}
    </div>
  );
};

export default DraggableImage;

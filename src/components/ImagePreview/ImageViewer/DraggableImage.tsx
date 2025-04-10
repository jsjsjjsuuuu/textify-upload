
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DraggableImageProps {
  src: string | null;
  zoomLevel: number;
  onImageLoad?: () => void;
  onImageError?: () => void;
  imageLoaded?: boolean;
  onZoomChange?: (newZoom: number) => void;
}

const DraggableImage = ({
  src,
  zoomLevel,
  onImageLoad,
  onImageError,
  imageLoaded,
  onZoomChange
}: DraggableImageProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [localZoomLevel, setLocalZoomLevel] = useState(zoomLevel);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // استعادة الموقع عند تغيير مستوى التكبير
  useEffect(() => {
    setLocalZoomLevel(zoomLevel);
  }, [zoomLevel]);

  // إعادة تعيين الموقع عند تغيير الصورة
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [src]);

  // وظائف التكبير والتصغير
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(localZoomLevel + 0.25, 3);
    setLocalZoomLevel(newZoom);
    if (onZoomChange) onZoomChange(newZoom);
  }, [localZoomLevel, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(localZoomLevel - 0.25, 0.5);
    setLocalZoomLevel(newZoom);
    if (onZoomChange) onZoomChange(newZoom);
  }, [localZoomLevel, onZoomChange]);

  const handleResetZoom = useCallback(() => {
    setLocalZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    if (onZoomChange) onZoomChange(1);
  }, [onZoomChange]);

  // وظيفة النقر المزدوج على الصورة
  const handleDoubleClick = useCallback(() => {
    if (localZoomLevel > 1) {
      handleResetZoom();
    } else {
      handleZoomIn();
    }
  }, [localZoomLevel, handleZoomIn, handleResetZoom]);

  // معالجات سحب الماوس
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (localZoomLevel > 1) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [localZoomLevel, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && localZoomLevel > 1) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;

      // حساب الحدود لمنع سحب الصورة خارج العرض بالكامل
      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;
      const imageWidth = (imageRef.current?.naturalWidth || 0) * localZoomLevel;
      const imageHeight = (imageRef.current?.naturalHeight || 0) * localZoomLevel;
      
      // حساب نطاق السحب المسموح به
      const maxX = Math.max(0, (imageWidth - containerWidth) / 2) * 1.5;
      const maxY = Math.max(0, (imageHeight - containerHeight) / 2) * 1.5;

      // تقييد موضع السحب
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);

      // استخدام requestAnimationFrame للحصول على تحديثات أكثر سلاسة
      requestAnimationFrame(() => {
        setPosition({
          x: boundedX,
          y: boundedY
        });
      });
      e.preventDefault();
    }
  }, [isDragging, localZoomLevel, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // إدارة اللمس للأجهزة المحمولة
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (localZoomLevel > 1 && e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setStartPos({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  }, [localZoomLevel, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && localZoomLevel > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - startPos.x;
      const newY = touch.clientY - startPos.y;

      // نفس حسابات الحدود كما في معالج الماوس
      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;
      const imageWidth = (imageRef.current?.naturalWidth || 0) * localZoomLevel;
      const imageHeight = (imageRef.current?.naturalHeight || 0) * localZoomLevel;
      const maxX = Math.max(0, (imageWidth - containerWidth) / 2) * 1.5;
      const maxY = Math.max(0, (imageHeight - containerHeight) / 2) * 1.5;

      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);

      requestAnimationFrame(() => {
        setPosition({
          x: boundedX,
          y: boundedY
        });
      });
      e.preventDefault();
    }
  }, [isDragging, localZoomLevel, startPos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!src) return null;

  return (
    <div
      ref={imageContainerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
    >
      {/* أزرار التكبير والتصغير */}
      <div className="absolute top-3 left-3 z-50 flex space-x-2 rtl:space-x-reverse">
        <button 
          onClick={handleZoomIn}
          className="w-9 h-9 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full flex items-center justify-center border border-gray-700/50 shadow-lg"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-9 h-9 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full flex items-center justify-center border border-gray-700/50 shadow-lg"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={handleResetZoom}
          className="w-9 h-9 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full flex items-center justify-center border border-gray-700/50 shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      
      {/* مستوى التكبير */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm py-1 px-3 rounded-full shadow-lg">
        {Math.round(localZoomLevel * 100)}%
      </div>
      
      {/* رسالة السحب */}
      {localZoomLevel > 1 && (
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm py-1 px-3 rounded-full shadow-lg pointer-events-none">
          اسحب الصورة للتنقل
        </div>
      )}
      
      {/* الصورة نفسها */}
      <img
        ref={imageRef}
        src={src}
        alt="صورة الوصل"
        className={`max-h-full transition-all ${localZoomLevel > 1 ? 'cursor-move' : 'cursor-pointer'}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${localZoomLevel})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onLoad={onImageLoad}
        onError={onImageError}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
      />
    </div>
  );
};

export default DraggableImage;

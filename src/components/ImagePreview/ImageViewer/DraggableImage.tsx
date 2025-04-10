
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableImageProps {
  src: string | null;
  zoomLevel: number;
  onImageLoad?: () => void;
  onImageError?: () => void;
  imageLoaded?: boolean;
}

const DraggableImage = ({
  src,
  zoomLevel,
  onImageLoad,
  onImageError,
  imageLoaded
}: DraggableImageProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [localZoomLevel, setLocalZoomLevel] = useState(zoomLevel);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // استعادة الموقع عند تغيير مستوى التكبير
  useEffect(() => {
    setLocalZoomLevel(zoomLevel);
    // عند تغيير مستوى التكبير، تعيين isZoomed بناءً على ما إذا كان مستوى التكبير أكبر من 1
    setIsZoomed(zoomLevel > 1);
  }, [zoomLevel]);

  // إعادة تعيين الموقع عند تغيير الصورة
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [src]);

  // وظيفة النقر على الصورة
  const handleImageClick = useCallback(() => {
    if (!isDragging) {
      setIsZoomed(!isZoomed);
      setPosition({ x: 0, y: 0 });
      setLocalZoomLevel(isZoomed ? 1 : 1.5);
    }
  }, [isDragging, isZoomed]);

  // وظيفة النقر المزدوج على الصورة
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
    setLocalZoomLevel(1);
  }, []);

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

  // إظهار إشارة لإخراج المؤشر من الصورة
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
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${localZoomLevel > 1 ? 'cursor-move' : 'cursor-pointer'}`}
      onClick={handleImageClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        ref={imageRef}
        src={src}
        alt="صورة الوصل"
        className={`max-h-full transition-all duration-200 ${localZoomLevel > 1 ? '' : 'hover:opacity-95'}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${localZoomLevel})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onLoad={onImageLoad}
        onError={onImageError}
        draggable={false}
      />
      {isZoomed && (
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
          انقر مرتين للعودة
        </div>
      )}
      {localZoomLevel > 1 && (
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
          اسحب الصورة للتنقل
        </div>
      )}
    </div>
  );
};

export default DraggableImage;

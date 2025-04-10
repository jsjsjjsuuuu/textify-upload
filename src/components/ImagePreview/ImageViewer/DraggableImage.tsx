
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
      setLocalZoomLevel(isZoomed ? zoomLevel : zoomLevel * 2);
    }
  }, [isDragging, isZoomed, zoomLevel]);

  // وظيفة النقر المزدوج على الصورة
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
    setLocalZoomLevel(zoomLevel);
  }, [zoomLevel]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [isZoomed, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;

      // Calculate bounds to prevent dragging image completely out of view
      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;
      const imageWidth = (imageRef.current?.naturalWidth || 0) * localZoomLevel;
      const imageHeight = (imageRef.current?.naturalHeight || 0) * localZoomLevel;
      const maxX = Math.max(0, (imageWidth - containerWidth) / 2) * 1.5;
      const maxY = Math.max(0, (imageHeight - containerHeight) / 2) * 1.5;

      // Bound the position
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setPosition({
          x: boundedX,
          y: boundedY
        });
      });
      e.preventDefault();
    }
  }, [isDragging, isZoomed, startPos, localZoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!src) return null;

  return (
    <div
      ref={imageContainerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${isZoomed ? 'cursor-move' : 'cursor-pointer'}`}
      onClick={handleImageClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imageRef}
        src={src}
        alt="صورة الوصل"
        className={`max-h-full transition-all duration-200 ${isZoomed ? '' : 'hover:opacity-90'}`}
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
    </div>
  );
};

export default DraggableImage;

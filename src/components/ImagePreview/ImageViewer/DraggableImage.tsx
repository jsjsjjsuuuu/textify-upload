
import { useRef, useState, useEffect } from "react";
import ImageErrorDisplay from "./ImageErrorDisplay";

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
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    // Reset position when zoom level changes
    if (zoomLevel === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);
  
  // Mouse drag handlers - improved for better performance
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault(); // Prevent default behavior
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;
      
      // Calculate bounds to prevent dragging image completely out of view
      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;
      const imageWidth = (imageRef.current?.naturalWidth || 0) * zoomLevel;
      const imageHeight = (imageRef.current?.naturalHeight || 0) * zoomLevel;
      
      const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
      const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
      
      // Bound the position
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);
      
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
      
      e.preventDefault(); // Prevent default behavior
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <div 
      ref={imageContainerRef}
      className="overflow-hidden relative h-[550px] w-full flex items-center justify-center bg-transparent rounded-md cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {src && (
        <div className="relative w-full h-full flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
          )}
          
          <img 
            ref={imageRef}
            src={src}
            alt="معاينة موسعة" 
            className="transition-all duration-150"
            style={{ 
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              opacity: imageLoaded ? 1 : 0,
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              transformOrigin: 'center',
              pointerEvents: 'none', // Prevents image from capturing mouse events
              willChange: 'transform', // Optimize for transforms
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

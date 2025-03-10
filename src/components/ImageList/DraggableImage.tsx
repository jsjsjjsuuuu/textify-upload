
import { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const DraggableImage = ({ image, onImageClick, formatDate }: DraggableImageProps) => {
  const [zoomLevel, setZoomLevel] = useState(1.7); // تكبير تلقائي بنسبة 70%
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Reset position when component mounts
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, []);
  
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
    setZoomLevel(1.7); // إعادة تعيين إلى تكبير 70%
    setPosition({ x: 0, y: 0 });
  };
  
  // Mouse drag handlers - improved for performance
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      
      e.preventDefault();
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  const handleImageClick = () => {
    // Only trigger image click if not dragging
    if (!isDragging) {
      onImageClick(image);
    }
  };

  return (
    <div className="p-4 bg-transparent relative">
      <ZoomControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
      
      <div 
        ref={imageContainerRef}
        className="relative w-full h-[500px] overflow-hidden bg-transparent cursor-move flex items-center justify-center" 
        onClick={handleImageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          ref={imageRef}
          src={image.previewUrl} 
          alt="صورة محملة" 
          className="w-full h-full object-contain transition-transform duration-150" 
          style={{ 
            transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
            maxHeight: '100%',
            maxWidth: '100%',
            transformOrigin: 'center',
            pointerEvents: 'none', // Prevents image from capturing mouse events
            willChange: 'transform', // Optimize for transforms
          }} 
          onError={() => setImgError(true)}
        />
        
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M17.5 5c-2.6-2.4-6.8-2.4-9.3 0m11.3 4c-3.3-3-8.2-3-11.5 0m13.3 4c-4-3.6-9.6-3.6-13.5 0"/></svg>
            <p className="mt-2 text-xs text-center text-muted-foreground">الصورة غير متاحة حاليًا</p>
          </div>
        )}
        
        <div className="absolute top-1 right-1 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
          صورة {image.number}
        </div>
        
        {image.status === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <span className="text-xs">جاري المعالجة...</span>
          </div>
        )}
        
        {image.status === "completed" && (
          <div className="absolute top-1 left-1 bg-green-500 text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        )}
        
        {image.status === "error" && (
          <div className="absolute top-1 left-1 bg-destructive text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        )}
        
        {image.submitted && (
          <div className="absolute bottom-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
            تم الإرسال
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 text-center">
        {formatDate(image.date)}
      </div>
      
      {image.confidence !== undefined && (
        <div className="mt-2 text-center">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            دقة الاستخراج: {Math.round(image.confidence)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default DraggableImage;


import { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";
import ImageErrorHandler from "@/components/common/ImageErrorHandler";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const DraggableImage = ({ image, onImageClick, formatDate }: DraggableImageProps) => {
  // State for zoom and dragging
  const [zoomLevel, setZoomLevel] = useState(1.5); // تكبير تلقائي بنسبة 50%
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // إعادة ضبط الموقع عند تحميل المكون أو تغيير الصورة
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setImgError(false);
    setRetryCount(0);
    setIsRetrying(false);
  }, [image.id]);
  
  // Zoom control handlers
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
    setZoomLevel(1.5);
    setPosition({ x: 0, y: 0 });
  };
  
  // Mouse drag handlers
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

  // معالجة خطأ تحميل الصورة بشكل أفضل
  const handleImageError = () => {
    console.log(`فشل تحميل الصورة: ${image.id}, محاولة: ${retryCount + 1}`);
    setImgError(true);
    
    // محاولة إعادة التحميل تلقائيًا إذا لم يتم تجاوز الحد الأقصى
    if (retryCount < 2) {
      handleRetryLoadImage();
    } else {
      setIsRetrying(false);
    }
  };

  // محاولة تحميل الصورة مرة أخرى
  const handleRetryLoadImage = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    if (imageRef.current) {
      const timestamp = new Date().getTime();
      let originalSrc = image.previewUrl;
      
      // إزالة أي معلمات URL سابقة
      originalSrc = originalSrc.split('?')[0];
      
      // إعادة تعيين مصدر الصورة لتحميلها مرة أخرى
      imageRef.current.src = "";
      
      setTimeout(() => {
        if (imageRef.current) {
          // إضافة معلمة الوقت لتجنب التخزين المؤقت
          imageRef.current.src = `${originalSrc}?t=${timestamp}`;
          console.log(`إعادة محاولة تحميل الصورة: ${originalSrc}?t=${timestamp}`);
          
          // تعيين حالة الخطأ إلى false ليتم إعادة عرض الصورة
          setImgError(false);
          
          // إعادة تعيين حالة المحاولة بعد فترة زمنية في حالة فشل التحميل
          setTimeout(() => {
            setIsRetrying(false);
          }, 5000); // انتظر 5 ثوانٍ كحد أقصى
        }
      }, 100);
    }
  };

  return (
    <div className="p-3 bg-transparent relative">
      <ZoomControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
      
      <div 
        ref={imageContainerRef}
        className="relative w-full h-[420px] overflow-hidden bg-transparent cursor-move flex items-center justify-center" 
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
            display: imgError ? 'none' : 'block',
          }} 
          onError={handleImageError}
          crossOrigin="anonymous"
        />
        
        {imgError && (
          <ImageErrorHandler 
            imageId={image.id}
            onRetry={handleRetryLoadImage}
            retryCount={retryCount}
            maxRetries={2}
            isLoading={isRetrying}
          />
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
      
      <div className="text-xs text-muted-foreground mt-1 text-center">
        {formatDate(image.date)}
      </div>
      
      {image.confidence !== undefined && (
        <div className="mt-1 text-center">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            دقة الاستخراج: {Math.round(image.confidence)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default DraggableImage;

import { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ImageErrorHandler from "@/components/common/ImageErrorHandler";
import ZoomControls from "./ZoomControls";
import ImageMetadata from "./ImageMetadata";
import DraggableImageCore from "./DraggableImageCore";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const DraggableImage = ({ image, onImageClick, formatDate }: DraggableImageProps) => {
  // حالة التكبير والسحب
  const [zoomLevel, setZoomLevel] = useState(1.5); // تكبير تلقائي بنسبة 50%
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorType, setErrorType] = useState<"network" | "format" | "access" | "general">("general");
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // إعادة ضبط الموقع عند تحميل المكون أو تغيير الصورة
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setImgError(false);
    setRetryCount(0);
    setIsRetrying(false);
    setErrorType("general");
  }, [image.id]);
  
  // مناولات التحكم في التكبير
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
  
  // مناولات سحب الماوس
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
      
      // حساب الحدود لمنع سحب الصورة خارج نطاق الرؤية بالكامل
      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;
      const imageWidth = (imageRef.current?.naturalWidth || 0) * zoomLevel;
      const imageHeight = (imageRef.current?.naturalHeight || 0) * zoomLevel;
      
      const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
      const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
      
      // تقييد الموضع
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);
      
      // استخدام requestAnimationFrame لتحديثات أكثر سلاسة
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
    // تشغيل نقرة الصورة فقط في حالة عدم السحب
    if (!isDragging) {
      onImageClick(image);
    }
  };

  // معالجة خطأ تحميل الصورة
  const handleImageError = () => {
    console.log(`فشل تحميل الصورة: ${image.id}, محاولة: ${retryCount + 1}`);
    setImgError(true);
    
    // تحديد نوع الخطأ استنادًا إلى حالة الاتصال وعدد المحاولات
    if (!navigator.onLine) {
      setErrorType("network");
    } else if (retryCount >= 2) {
      setErrorType("access");
    }
    
    // محاولة إعادة التحميل تلقائيًا إذا لم يتم تجاوز الحد الأقصى
    if (retryCount < 2) {
      handleRetryLoadImage();
    } else {
      setIsRetrying(false);
    }
  };

  // محاولة تحميل الصورة مرة أخرى
  const handleRetryLoadImage = () => {
    // تحديث نوع الخطأ إذا تغيرت حالة الاتصال
    if (!navigator.onLine) {
      setErrorType("network");
    } else {
      setErrorType("general");
    }
    
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
      
      <DraggableImageCore
        imageRef={imageRef}
        containerRef={imageContainerRef}
        previewUrl={image.previewUrl}
        zoomLevel={zoomLevel}
        position={position}
        isDragging={isDragging}
        imgError={imgError}
        isRetrying={isRetrying}
        errorType={errorType}
        retryCount={retryCount}
        imageId={image.id}
        status={image.status}
        submitted={image.submitted}
        number={image.number}
        onImageClick={handleImageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onImageError={handleImageError}
        onRetryLoadImage={handleRetryLoadImage}
      />
      
      <ImageMetadata
        image={image}
        formatDate={formatDate}
        hasError={imgError}
      />
    </div>
  );
};

export default DraggableImage;

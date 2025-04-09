
import { useRef, useState, useEffect } from "react";
import ImageErrorDisplay from "./ImageErrorDisplay";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion"; // تصحيح الاستيراد هنا
import { ZoomIn, ZoomOut, RefreshCw, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  
  // إضافة متغير جديد لتتبع مستوى التكبير الإضافي
  const [extraZoom, setExtraZoom] = useState(1);
  // حساب التكبير النهائي
  const finalZoomLevel = zoomLevel * extraZoom;

  // إضافة حالة تكبير كامل الشاشة
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  useEffect(() => {
    // Reset position and error state when src changes
    setPosition({ x: 0, y: 0 });
    setExtraZoom(1);
    setImgError(false);
  }, [src]);
  
  useEffect(() => {
    // Reset position when zoom level changes
    if (zoomLevel === 1 && extraZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel, extraZoom]);

  // مراقبة وضع الشاشة الكاملة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // حساب حدود الحركة بناءً على حجم الصورة ومستوى التكبير
  const calculateBounds = () => {
    if (!imageRef.current || !imageContainerRef.current) return { maxX: 0, maxY: 0 };
    
    const containerWidth = imageContainerRef.current.clientWidth;
    const containerHeight = imageContainerRef.current.clientHeight;
    const imageWidth = (imageDimensions.width || imageRef.current.naturalWidth || 0) * finalZoomLevel;
    const imageHeight = (imageDimensions.height || imageRef.current.naturalHeight || 0) * finalZoomLevel;
    
    const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
    const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
    
    return { maxX, maxY };
  };
  
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
      
      // يتم حساب الحدود الجديدة وتطبيقها
      const { maxX, maxY } = calculateBounds();
      
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

  // دعم للجوال - معالجة اللمس
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - startPos.x;
      const newY = e.touches[0].clientY - startPos.y;
      
      const { maxX, maxY } = calculateBounds();
      
      // تطبيق الحدود
      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);
      
      // تحديث الموضع بسلاسة
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
      
      e.preventDefault(); // منع السلوك الافتراضي للصفحة
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  const handleImageLoadSuccess = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
    onImageLoad();
  };
  
  const handleImageLoadError = () => {
    if (retryCount < 2) {
      // محاولة تحميل الصورة مرة أخرى
      setRetryCount(prev => prev + 1);
      // إضافة طابع زمني لتجنب التخزين المؤقت
      const newSrc = src ? `${src}?t=${Date.now()}` : null;
      if (newSrc && imageRef.current) {
        imageRef.current.src = newSrc;
      } else {
        setImgError(true);
        onImageError();
      }
    } else {
      setImgError(true);
      onImageError();
    }
  };
  
  const handleRetry = () => {
    if (src) {
      setRetryCount(0);
      setImgError(false);
      // إضافة طابع زمني لتجنب التخزين المؤقت
      const newSrc = `${src}?t=${Date.now()}`;
      if (imageRef.current) {
        imageRef.current.src = newSrc;
      }
      toast({
        title: "إعادة تحميل",
        description: "جاري محاولة تحميل الصورة مرة أخرى..."
      });
    }
  };
  
  // وظائف التكبير والتصغير المحسنة
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExtraZoom(prev => Math.min(prev + 0.25, 5)); // زيادة التكبير الأقصى إلى 5x
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExtraZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExtraZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // وظيفة تبديل وضع ملء الشاشة
  const toggleFullScreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!document.fullscreenElement) {
      try {
        if (imageContainerRef.current?.requestFullscreen) {
          await imageContainerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.error("خطأ في تفعيل ملء الشاشة:", err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error("خطأ في الخروج من وضع ملء الشاشة:", err);
      }
    }
  };

  return (
    <div 
      ref={imageContainerRef}
      className={`overflow-hidden relative ${isFullScreen ? 'h-screen w-screen' : 'h-[550px] w-full'} flex items-center justify-center bg-transparent rounded-md cursor-move`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* أزرار التكبير والتصغير */}
      <div className="absolute top-2 left-2 z-20 flex gap-2">
        <Button variant="secondary" size="icon" onClick={handleZoomIn} className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800">
          <ZoomIn size={16} />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut} className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800">
          <ZoomOut size={16} />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleResetZoom} className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800">
          <RefreshCw size={16} />
        </Button>
        <Button variant="secondary" size="icon" onClick={toggleFullScreen} className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800">
          <Maximize size={16} />
        </Button>
      </div>
      
      {/* معلومات التكبير */}
      <div className="absolute bottom-2 left-2 z-20 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
        {Math.round(finalZoomLevel * 100)}%
      </div>
      
      {/* تعليمات الاستخدام - تظهر فقط عند التكبير */}
      {finalZoomLevel > 1.2 && (
        <div className="absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded text-xs max-w-48">
          اسحب الصورة للتنقل بين أجزائها
        </div>
      )}
      
      {src && !imgError && (
        <div className="relative w-full h-full flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          <img 
            ref={imageRef}
            src={src}
            alt="معاينة موسعة" 
            className="transition-all duration-150"
            style={{ 
              transform: `scale(${finalZoomLevel}) translate(${position.x / finalZoomLevel}px, ${position.y / finalZoomLevel}px)`,
              opacity: imageLoaded ? 1 : 0,
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              transformOrigin: 'center',
              pointerEvents: 'none', // Prevents image from capturing mouse events
              willChange: 'transform', // Optimize for transforms
            }}
            onLoad={handleImageLoadSuccess}
            onError={handleImageLoadError}
          />
        </div>
      )}
      
      {(imgError || !src) && (
        <ImageErrorDisplay onRetry={handleRetry} />
      )}
    </div>
  );
};

export default DraggableImage;

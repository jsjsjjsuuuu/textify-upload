
import { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const DraggableImage = ({
  image,
  onImageClick,
  formatDate
}: DraggableImageProps) => {
  // State for zoom and dragging
  const [zoomLevel, setZoomLevel] = useState(1.5); // تكبير تلقائي بنسبة 50%
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  const [startPos, setStartPos] = useState({
    x: 0,
    y: 0
  });
  const [imgError, setImgError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(image.previewUrl);
  const [retryCount, setRetryCount] = useState(0); // إضافة عداد للمحاولات
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  
  // تحميل الصورة من التخزين إذا كان مسار التخزين متوفرًا
  useEffect(() => {
    const getImageUrl = async () => {
      setImgError(false); // إعادة تعيين حالة الخطأ عند تغيير الصورة
      
      if (image.storage_path) {
        try {
          const { data } = supabase.storage
            .from('receipt_images')
            .getPublicUrl(image.storage_path);
            
          if (data && data.publicUrl) {
            console.log("تم الحصول على رابط الصورة من التخزين:", data.publicUrl);
            setImageUrl(data.publicUrl);
          } else if (image.previewUrl) {
            console.log("استخدام عنوان المعاينة الاحتياطي:", image.previewUrl);
            setImageUrl(image.previewUrl);
          } else {
            console.error("لا يوجد رابط صورة متاح");
            setImgError(true);
          }
        } catch (error) {
          console.error("خطأ في جلب عنوان URL للصورة:", error);
          if (image.previewUrl) {
            setImageUrl(image.previewUrl);
          } else {
            setImgError(true);
          }
        }
      } else if (image.previewUrl) {
        setImageUrl(image.previewUrl);
      } else {
        setImgError(true);
      }
    };
    
    getImageUrl();
  }, [image.storage_path, image.previewUrl, image.id]);

  // Reset position when component mounts
  useEffect(() => {
    setPosition({
      x: 0,
      y: 0
    });
  }, []);

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
    setZoomLevel(1.5); // إعادة تعيين إلى تكبير 50%
    setPosition({
      x: 0,
      y: 0
    });
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
        setPosition({
          x: boundedX,
          y: boundedY
        });
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
  
  const handleImageError = () => {
    console.error("فشل تحميل الصورة:", imageUrl);
    
    if (retryCount < 2) {
      // محاولة استرداد الصورة باستخدام مصدر بديل
      setRetryCount(prev => prev + 1);
      
      // جرب مصدر مختلف بناءً على ما إذا كنا نستخدم التخزين أو المعاينة
      if (image.storage_path && imageUrl === image.previewUrl) {
        const { data } = supabase.storage
          .from('receipt_images')
          .getPublicUrl(image.storage_path);
          
        if (data && data.publicUrl && data.publicUrl !== imageUrl) {
          console.log("محاولة استخدام عنوان URL من التخزين:", data.publicUrl);
          setImageUrl(data.publicUrl);
          return;
        }
      } else if (image.previewUrl && imageUrl !== image.previewUrl) {
        console.log("محاولة استخدام عنوان URL من المعاينة:", image.previewUrl);
        setImageUrl(image.previewUrl);
        return;
      }
    }
    
    // إذا استنفدنا جميع المحاولات، نعرض رسالة خطأ
    setImgError(true);
  };
  
  const handleRetryImage = () => {
    if (image.storage_path) {
      // حاول تحميل الصورة من التخزين مرة أخرى
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(image.storage_path);
        
      if (data && data.publicUrl) {
        // إضافة طابع زمني لتجنب التخزين المؤقت
        setImageUrl(`${data.publicUrl}?t=${Date.now()}`);
        setImgError(false);
        setRetryCount(0);
        toast({
          title: "إعادة تحميل",
          description: "جاري محاولة تحميل الصورة مرة أخرى..."
        });
      }
    } else if (image.previewUrl) {
      // حاول تحميل الصورة من المعاينة مرة أخرى
      setImageUrl(`${image.previewUrl}?t=${Date.now()}`);
      setImgError(false);
      setRetryCount(0);
      toast({
        title: "إعادة تحميل",
        description: "جاري محاولة تحميل الصورة مرة أخرى..."
      });
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
        {imageUrl && !imgError && (
          <img 
            ref={imageRef}
            src={imageUrl}
            alt="صورة محملة"
            className="w-full h-full object-contain transition-transform duration-150"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              maxHeight: '100%',
              maxWidth: '100%',
              transformOrigin: 'center',
              pointerEvents: 'none', // Prevents image from capturing mouse events
              willChange: 'transform' // Optimize for transforms
            }}
            onError={handleImageError}
          />
        )}
        
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <path d="M10.5 2.5 2 12l8.5 9.5c.69.76 1.81.76 2.5 0L21.5 12 13 2.5c-.69-.76-1.81-.76-2.5 0Z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
            <p className="mt-2 text-xs text-center text-muted-foreground">الصورة غير متاحة حاليًا</p>
            <button 
              onClick={handleRetryImage} 
              className="mt-2 px-3 py-1 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        
        <div className="absolute top-1 right-1 text-white px-2 py-1 rounded-full text-xs bg-gray-900">
          صورة {image.number}
        </div>
        
        {image.status === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <span className="text-xs">جاري المعالجة...</span>
          </div>
        )}
        
        {image.status === "completed" && (
          <div className="absolute top-1 left-1 bg-green-500 text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
        
        {image.status === "error" && (
          <div className="absolute top-1 left-1 bg-destructive text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
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
    </div>
  );
};

export default DraggableImage;

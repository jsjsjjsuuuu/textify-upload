
import { useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ErrorDisplay from "./ErrorDisplay";

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
  onRetryLoad?: (imageId: string) => void;
}

const DraggableImage = ({
  image,
  onImageClick,
  formatDate,
  onRetryLoad
}: DraggableImageProps) => {
  // State for zoom and dragging
  const [zoomLevel, setZoomLevel] = useState(1.5); // تكبير تلقائي بنسبة 50%
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(image.previewUrl);
  const [retryCount, setRetryCount] = useState(image.retryCount || 0); // استخدام عداد المحاولات من الصورة
  const [isZoomed, setIsZoomed] = useState(false);
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
            console.log("تم الحصول على رابط الصورة من التخزين:", data.publicUrl.substring(0, 50) + "...");
            setImageUrl(data.publicUrl);
          } else if (image.previewUrl) {
            console.log("استخدام عنوان المعاينة الاحتياطي:", image.previewUrl.substring(0, 50) + "...");
            setImageUrl(image.previewUrl);
          } else {
            console.error("لا يوجد رابط صورة متاح");
            setImgError(true);
            setErrorMessage("لا يوجد رابط صورة متاح");
          }
        } catch (error) {
          console.error("خطأ في جلب عنوان URL للصورة:", error);
          setErrorMessage("خطأ في جلب رابط الصورة من الخادم");
          
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
        setErrorMessage("لا يوجد مسار تخزين أو معاينة للصورة");
      }
    };
    
    getImageUrl();
  }, [image.storage_path, image.previewUrl, image.id]);

  // Reset position when component mounts or when image changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(1.5); // إعادة تعيين التكبير إلى 50%
    setIsZoomed(false);
  }, [image.id]);

  // وظيفة النقر على الصورة
  const handleImageClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      if (!isZoomed) {
        // تكبير الصورة عند النقر عليها
        setIsZoomed(true);
        setZoomLevel(prev => prev * 1.5);
      } else {
        // عند النقر على الصورة المكبرة، قم بالتحديد فقط
        onImageClick(image);
      }
    }
    e.stopPropagation();
  };
  
  // وظيفة النقر المزدوج على الصورة
  const handleDoubleClick = (e: React.MouseEvent) => {
    // إعادة تعيين حجم الصورة عند النقر المزدوج
    setIsZoomed(false);
    setZoomLevel(1.5);
    setPosition({ x: 0, y: 0 });
    e.stopPropagation();
    e.preventDefault();
  };

  // Zoom control handlers
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
    if (!isZoomed) setIsZoomed(true);
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1.5); // إعادة تعيين إلى تكبير 50%
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging && isZoomed) {
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
  
  const handleImageError = () => {
    console.error("فشل تحميل الصورة:", imageUrl?.substring(0, 50) + "...");
    setImgError(true);
    setErrorMessage("فشل في تحميل الصورة من المصدر");
  };
  
  const handleRetryImage = () => {
    // زيادة عداد المحاولات
    setRetryCount(prev => prev + 1);
    
    if (image.storage_path) {
      // استخدام نهج أكثر قوة: إضافة طابع زمني عشوائي لتجنب ذاكرة التخزين المؤقت
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(image.storage_path);
        
      if (data && data.publicUrl) {
        const timestamp = new Date().getTime();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const freshUrl = `${data.publicUrl}?t=${timestamp}&r=${randomSuffix}`;
        
        setImageUrl(freshUrl);
        setImgError(false);
        setErrorMessage(undefined);
        
        toast({
          title: "إعادة تحميل",
          description: "جاري محاولة تحميل الصورة مرة أخرى...",
          variant: "default"
        });
      }
    } else if (image.previewUrl) {
      // محاولة استخدام URL للمعاينة مع تجنب التخزين المؤقت
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const freshUrl = `${image.previewUrl}?t=${timestamp}&r=${randomSuffix}`;
      
      setImageUrl(freshUrl);
      setImgError(false);
      setErrorMessage(undefined);
    }
    
    // استدعاء وظيفة إعادة المحاولة من الخارج إذا كانت موجودة
    if (onRetryLoad) {
      onRetryLoad(image.id);
    }
  };

  // تحديد حالة الصورة - إظهار حالة التحميل للصور الجديدة
  const isLoading = image.status === "processing";

  return (
    <div className="p-3 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden">
      {/* أدوات التكبير/التصغير */}
      <ZoomControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onResetZoom={handleResetZoom} 
      />
      
      {/* حاوية الصورة الرئيسية */}
      <div 
        ref={imageContainerRef} 
        className={`relative w-full h-[320px] overflow-hidden flex items-center justify-center rounded-md ${isZoomed ? 'cursor-move bg-gray-800 dark:bg-gray-900' : 'cursor-pointer bg-gray-100 dark:bg-gray-800'}`}
        onClick={handleImageClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* الصورة قابلة للسحب */}
        {!imgError && imageUrl && (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt={`صورة ${image.number || ''}`}
              className={`max-w-full max-h-full ${isLoading ? 'opacity-40' : 'opacity-100'} transition-all duration-300 ${isZoomed ? '' : 'hover:opacity-90'}`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              onError={handleImageError}
              draggable={false}
            />
            {isZoomed && (
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
                انقر مرتين للعودة
              </div>
            )}
          </>
        )}
        
        {/* عرض خطأ الصورة مع إمكانية إعادة المحاولة */}
        {imgError && (
          <ErrorDisplay 
            onRetry={handleRetryImage}
            errorMessage={errorMessage}
            retryCount={retryCount}
          />
        )}
        
        {/* مؤشر حالة المعالجة */}
        {isLoading && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
              <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm font-medium">جاري معالجة الصورة...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* معلومات الصورة في الأسفل */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>
          {image.file?.name ? `${image.file.name} (${(image.file.size / 1024).toFixed(0)} كيلوبايت)` : 'وصل'}
        </span>
        <span dir="ltr">{formatDate(new Date(image.date))}</span>
      </div>
      
      {/* حالة الصورة */}
      <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full 
        ${image.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200" : ""}
        ${image.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200" : ""}
        ${image.status === "error" ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200" : ""}
        ${image.status === "processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200" : ""}
      `}>
        {image.status === "completed" && "مكتملة"}
        {image.status === "pending" && "قيد الانتظار"}
        {image.status === "error" && "خطأ"}
        {image.status === "processing" && "قيد المعالجة"}
      </div>
    </div>
  );
};

export default DraggableImage;

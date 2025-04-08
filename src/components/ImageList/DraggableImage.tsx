
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
    setZoomLevel(1.5); // إعادة تعيين إلى تكبير 50%
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
    <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-sm relative overflow-hidden">
      {/* أدوات التكبير/التصغير */}
      <ZoomControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onResetZoom={handleResetZoom} 
      />
      
      {/* حاوية الصورة الرئيسية */}
      <div 
        ref={imageContainerRef} 
        className="relative w-full h-[420px] overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-move flex items-center justify-center rounded-md" 
        onClick={handleImageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* الصورة قابلة للسحب */}
        {!imgError && imageUrl && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={`Image ${image.number || ''}`}
            className={`transform ${isLoading ? 'opacity-40' : 'opacity-100'} transition-opacity duration-300`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
            onError={handleImageError}
          />
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
          {image.file.name} ({(image.file.size / 1024).toFixed(0)} كيلوبايت)
        </span>
        <span dir="ltr">{formatDate(new Date(image.date))}</span>
      </div>
    </div>
  );
};

export default DraggableImage;

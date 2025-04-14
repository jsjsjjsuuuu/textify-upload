
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(image.retryCount || 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDataUrl, setIsDataUrl] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  
  // تحميل الصورة من التخزين أو تحويلها إلى Data URL
  useEffect(() => {
    console.log("تحميل الصورة:", image.id, "نوع المعاينة:", image.previewUrl?.substring(0, 20));
    setImgError(false); // إعادة تعيين حالة الخطأ عند تغيير الصورة
    setImageLoading(true);
    
    const loadImage = async () => {
      // حالة 1: إذا كانت previewUrl تبدأ بـ data: فهي آمنة للاستخدام مباشرةً
      if (image.previewUrl && image.previewUrl.startsWith('data:')) {
        console.log("استخدام Data URL موجود");
        setImageUrl(image.previewUrl);
        setIsDataUrl(true);
        setImageLoading(false);
        return;
      }
      
      // حالة 2: إذا كان لدينا مسار تخزين في سوبابيس، نستخدمه
      if (image.storage_path) {
        try {
          console.log("الحصول على URL من سوبابيس:", image.storage_path);
          const { data } = supabase.storage
            .from('receipt_images')
            .getPublicUrl(image.storage_path);
            
          if (data?.publicUrl) {
            setImageUrl(data.publicUrl);
            setIsDataUrl(false);
            setImageLoading(false);
          } else {
            throw new Error("لا يوجد رابط عام متاح من سوبابيس");
          }
        } catch (error) {
          console.error("خطأ في جلب URL من سوبابيس:", error);
          // في حالة الفشل، نحاول تحويل الملف مباشرة
          convertFileToDataUrl();
        }
        return;
      }
      
      // حالة 3: إذا كان لدينا previewUrl ولكنه blob URL أو آخر، نحاول تحويل الملف
      if (image.previewUrl && (image.previewUrl.startsWith('blob:') || image.previewUrl === "loading")) {
        console.log("تحويل blob URL إلى data URL");
        convertFileToDataUrl();
        return;
      }
      
      // حالة 4: لا يوجد previewUrl أو storage_path ولدينا الملف الأصلي، نقوم بتحويله
      if (image.file) {
        console.log("تحويل الملف مباشرة إلى data URL");
        convertFileToDataUrl();
        return;
      }
      
      // حالة 5: المعاينة غير آمنة ولا يوجد ملف، نظهر رسالة خطأ
      console.error("لا يمكن تحميل الصورة: ليس لدينا URL آمن أو ملف للتحويل");
      setImgError(true);
      setErrorMessage("لا يمكن تحميل الصورة: المصدر غير متاح");
      setImageLoading(false);
    };
    
    // وظيفة مساعدة لتحويل الملف إلى Data URL
    const convertFileToDataUrl = () => {
      if (!image.file) {
        console.error("لا يوجد ملف للتحويل!");
        setImgError(true);
        setErrorMessage("الملف غير متاح للتحويل");
        setImageLoading(false);
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setImageUrl(dataUrl);
          setIsDataUrl(true);
          setImageLoading(false);
          console.log("تم تحويل الملف إلى Data URL بنجاح");
        };
        reader.onerror = () => {
          console.error("فشل في قراءة الملف");
          setImgError(true);
          setErrorMessage("فشل في قراءة ملف الصورة");
          setImageLoading(false);
        };
        reader.readAsDataURL(image.file);
      } catch (error) {
        console.error("خطأ أثناء تحويل الملف:", error);
        setImgError(true);
        setErrorMessage("خطأ أثناء معالجة ملف الصورة");
        setImageLoading(false);
      }
    };
    
    loadImage();
  }, [image.id, image.previewUrl, image.storage_path, image.file]);

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
  
  const handleImageLoad = () => {
    console.log("تم تحميل الصورة بنجاح:", image.id);
    setImgError(false);
    setErrorMessage(undefined);
  };
  
  const handleRetryImage = () => {
    // زيادة عداد المحاولات
    setRetryCount(prev => prev + 1);
    
    // إذا كان لدينا ملف الصورة الأصلي، نحاول تحويله إلى Data URL
    if (image.file) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
          setIsDataUrl(true);
          setImgError(false);
          setErrorMessage(undefined);
          
          toast({
            title: "إعادة تحميل",
            description: "تم تحويل الصورة إلى Data URL بنجاح",
            variant: "default"
          });
        };
        reader.readAsDataURL(image.file);
        return;
      } catch (error) {
        console.error("فشل في تحويل الملف إلى Data URL:", error);
      }
    }
    
    // استدعاء وظيفة إعادة المحاولة من الخارج إذا كانت موجودة
    if (onRetryLoad) {
      onRetryLoad(image.id);
    }
    
    toast({
      title: "إعادة تحميل",
      description: "جاري محاولة تحميل الصورة مرة أخرى...",
      variant: "default"
    });
  };

  // تحديد حالة الصورة
  const isLoading = imageLoading || image.status === "processing";

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
        {/* حالة تحميل الصورة */}
        {isLoading && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
              <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm font-medium">
                {image.status === "processing" ? "جاري معالجة الصورة..." : "جاري تحميل الصورة..."}
              </p>
            </div>
          </div>
        )}
        
        {/* الصورة قابلة للسحب */}
        {!imgError && imageUrl && !imageLoading && (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt={`صورة ${image.number || ''}`}
              className={`max-w-full max-h-full transition-all duration-300 ${isZoomed ? '' : 'hover:opacity-90'}`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
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
        
        {/* مؤشر إذا كانت الصورة مستخدمة كـ Data URL للتشخيص */}
        {isDataUrl && !imgError && !isLoading && (
          <div className="absolute top-3 left-3 bg-green-500 bg-opacity-70 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
            data:URL
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

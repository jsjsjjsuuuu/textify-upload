
import React, { useState, useEffect } from 'react';
import { ImageData } from '@/types/ImageData';

export interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate?: (date: Date) => string;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ image, onImageClick, formatDate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // تحديث URL الصورة عند تغيير الصورة وإضافة معلمة زمنية
  useEffect(() => {
    if (image.previewUrl) {
      setImageUrl(`${image.previewUrl}?t=${Date.now()}`);
      setHasError(false);
      setIsLoading(true);
    } else {
      setImageUrl(null);
      setHasError(true);
      setIsLoading(false);
    }
  }, [image.id, image.previewUrl]);

  // محاولة تحديد حالة الصورة
  const getStatusLabel = () => {
    if (hasError) return "خطأ في تحميل الصورة";
    switch (image.status) {
      case "processing": return "جاري المعالجة...";
      case "pending": return "في انتظار المعالجة";
      case "completed": return "تمت المعالجة";
      case "error": return "فشل في المعالجة";
      default: return "";
    }
  };

  // الحصول على صورة آمنة أو صورة بديلة
  const getSafeImageUrl = () => {
    if (!imageUrl || hasError) {
      return '/placeholder-image.jpg';
    }
    return imageUrl;
  };
  
  // تعامل مع نجاح تحميل الصورة
  const handleLoad = () => {
    console.log("تم تحميل الصورة بنجاح:", image.id);
    setIsLoading(false);
  };

  // تعامل مع خطأ تحميل الصورة
  const handleError = () => {
    console.error("فشل تحميل الصورة:", image.id, imageUrl);
    setIsLoading(false);
    setHasError(true);
  };

  // إعادة محاولة تحميل الصورة
  const retryLoading = () => {
    if (image.previewUrl) {
      setIsLoading(true);
      setHasError(false);
      setImageUrl(`${image.previewUrl}?t=${Date.now()}&retry=true`);
    }
  };

  // معالج النقر على الصورة
  const handleClick = () => {
    onImageClick(image);
  };

  // لون الخلفية بناءً على الحالة
  const getStatusBgColor = () => {
    if (hasError) return "bg-red-100 text-red-700";
    
    switch (image.status) {
      case "processing": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "completed": return "bg-green-100 text-green-700";
      case "error": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div 
      className="relative h-52 md:h-full overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* صورة الإيصال */}
      <img
        src={getSafeImageUrl()}
        alt={image.code || "صورة إيصال"}
        className="w-full h-full object-cover transition-transform transform group-hover:scale-105"
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* شريط الحالة أسفل الصورة */}
      <div className={`absolute bottom-0 left-0 right-0 py-1 px-2 text-xs ${getStatusBgColor()} bg-opacity-80 backdrop-blur-sm flex items-center justify-between`}>
        <span>{getStatusLabel()}</span>
        {image.date && formatDate && <span>{formatDate(image.date)}</span>}
      </div>
      
      {/* طبقة تعتيم أثناء التحميل */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <span className="text-gray-400">جاري التحميل...</span>
        </div>
      )}
      
      {/* زر إعادة المحاولة عند الخطأ */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              retryLoading();
            }}
            className="bg-white dark:bg-gray-700"
          >
            إعادة تحميل
          </Button>
        </div>
      )}
    </div>
  );
};

export default DraggableImage;

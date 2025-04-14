
import { useState, useEffect, useRef } from 'react';
import { ImageData } from '@/types/ImageData';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableImageProps {
  image: ImageData;
  onImageClick?: (image: ImageData) => void;
  formatDate?: (date: Date) => string;
  onRetryLoad?: (imageId: string) => void;
}

/**
 * مكون عرض صورة قابل للسحب مع معالجة أخطاء التحميل
 */
const DraggableImage: React.FC<DraggableImageProps> = ({
  image,
  onImageClick,
  formatDate,
  onRetryLoad
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imageRef = useRef<HTMLImageElement>(null);
  
  // تحميل صورة المعاينة عند تغير الصورة
  useEffect(() => {
    if (!image.previewUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setImageSrc(image.previewUrl);
  }, [image.previewUrl, image.id]);

  // التعامل مع نجاح تحميل الصورة
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // التعامل مع فشل تحميل الصورة
  const handleImageError = () => {
    console.error('فشل في تحميل الصورة:', image.id);
    setIsLoading(false);
    setHasError(true);
  };

  // إعادة محاولة تحميل الصورة
  const handleRetry = () => {
    if (onRetryLoad) {
      onRetryLoad(image.id);
    } else {
      // إعادة تحميل الصورة الحالية
      setIsLoading(true);
      setHasError(false);
      // إضافة طابع زمني لتجاوز التخزين المؤقت للمتصفح
      setImageSrc(`${image.previewUrl}${image.previewUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
    }
  };

  // تحديد حالة العرض بناءً على حالة معالجة الصورة
  const getStatusClass = () => {
    if (image.status === 'error') return 'border-red-500';
    if (image.status === 'processing') return 'border-blue-500';
    if (image.status === 'completed') return 'border-green-500';
    return 'border-gray-300';
  };

  // التعامل مع حدث النقر على الصورة
  const handleClick = () => {
    if (onImageClick && !isLoading) {
      onImageClick(image);
    }
  };

  return (
    <div 
      className={`relative rounded-lg overflow-hidden border-2 ${getStatusClass()} bg-black min-h-[200px] shadow hover:shadow-md transition-shadow cursor-pointer`}
      onClick={handleClick}
    >
      {/* عرض الصورة */}
      <div className="w-full h-48 relative overflow-hidden bg-gray-900 flex items-center justify-center">
        {!hasError && imageSrc ? (
          <img
            ref={imageRef}
            src={imageSrc}
            alt={`صورة ${image.number || ''}`}
            className={`w-full h-full object-contain transition-opacity ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-gray-400 text-center p-4">
              <p className="mb-2">تعذر تحميل الصورة</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* مؤشر التحميل */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        
        {/* عرض حالة معالجة الصورة */}
        {image.status && (
          <div className={`absolute bottom-2 right-2 rounded-full px-2 py-1 text-xs ${
            image.status === 'completed' ? 'bg-green-500 text-white' :
            image.status === 'error' ? 'bg-red-500 text-white' : 
            image.status === 'processing' ? 'bg-blue-500 text-white' : 
            'bg-gray-500 text-white'
          }`}>
            {image.status === 'completed' ? 'مكتملة' :
             image.status === 'error' ? 'خطأ' :
             image.status === 'processing' ? 'جاري المعالجة' : 'قيد الانتظار'}
          </div>
        )}
      </div>

      {/* بيانات الصورة */}
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center">
          <div className="font-medium">
            {image.code ? (
              <span className="text-primary">{image.code}</span>
            ) : (
              <span className="text-gray-400">بدون كود</span>
            )}
          </div>
          {image.date && formatDate && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(image.date)}
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        {(image.senderName || image.phoneNumber) && (
          <div className="mt-1 text-sm">
            {image.senderName && (
              <div className="truncate text-gray-700 dark:text-gray-300">
                {image.senderName}
              </div>
            )}
            {image.phoneNumber && (
              <div className="text-gray-600 dark:text-gray-400">
                {image.phoneNumber}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableImage;

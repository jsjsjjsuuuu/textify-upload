
import { ImageOff, RefreshCw } from "lucide-react";

interface ImageErrorDisplayProps {
  onRetry?: () => void; // إضافة وظيفة إعادة المحاولة
  errorMessage?: string; // إضافة رسالة خطأ مخصصة
  retryCount?: number; // عدد المحاولات السابقة
}

const ImageErrorDisplay = ({ 
  onRetry, 
  errorMessage, 
  retryCount = 0 
}: ImageErrorDisplayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-white/80 dark:bg-gray-800/80 rounded-md">
      <ImageOff size={48} />
      <p className="mt-2 text-center font-medium">فشل تحميل الصورة</p>
      <p className="text-sm text-muted-foreground mt-1 mb-2">
        {errorMessage || "الصورة غير متاحة أو تم حذفها من الخادم"}
      </p>
      
      {retryCount > 0 && (
        <p className="text-xs text-amber-500 mb-2">
          تمت المحاولة {retryCount} {retryCount === 1 ? 'مرة' : 'مرات'} من قبل
        </p>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="px-4 py-1.5 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700 flex items-center"
        >
          <RefreshCw className="h-3.5 w-3.5 ml-1.5 animate-pulse" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;

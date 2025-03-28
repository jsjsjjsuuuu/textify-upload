
import { ImageOff } from "lucide-react";

interface ImageErrorDisplayProps {
  onRetry?: () => void; // إضافة وظيفة إعادة المحاولة
}

const ImageErrorDisplay = ({ onRetry }: ImageErrorDisplayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-white/80 dark:bg-gray-800/80">
      <ImageOff size={48} />
      <p className="mt-2 text-center font-medium">فشل تحميل الصورة</p>
      <p className="text-sm text-muted-foreground mt-1 mb-2">الصورة غير متاحة أو تم حذفها من الخادم</p>
      
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="px-4 py-1.5 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;

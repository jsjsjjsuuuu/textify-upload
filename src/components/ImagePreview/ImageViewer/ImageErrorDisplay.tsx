
import { ImageOff } from "lucide-react";

interface ImageErrorDisplayProps {
  errorMessage?: string; // رسالة الخطأ
  retryCount?: number; // عدد محاولات إعادة التحميل
  onRetry?: () => void; // إضافة وظيفة إعادة المحاولة كخاصية اختيارية
}

// مكون لعرض خطأ تحميل الصورة بشكل أكثر فائدة - تمت إزالة وظيفة إعادة المحاولة بشكل مباشر
const ImageErrorDisplay = ({ errorMessage, retryCount = 0, onRetry }: ImageErrorDisplayProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 bg-opacity-50 rounded-md p-4 text-center">
      <ImageOff className="h-20 w-20 text-gray-400 mb-4" />
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">فشل تحميل الصورة</h3>
      
      {errorMessage && (
        <p className="text-sm text-gray-600 mb-4 max-w-md">{errorMessage}</p>
      )}
      
      {!errorMessage && (
        <p className="text-sm text-gray-600 mb-4 max-w-md">
          تعذر عرض الصورة. قد تكون الصورة غير متوفرة أو تالفة.
        </p>
      )}
      
      {retryCount > 0 && (
        <p className="text-xs text-amber-600 mb-2">
          عدد المحاولات السابقة: {retryCount}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          إعادة تحميل الصورة
        </button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;

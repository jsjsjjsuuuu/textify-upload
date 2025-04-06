
import { ImageOff, RefreshCw } from "lucide-react";

interface ImageErrorDisplayProps {
  onRetry?: () => void; // وظيفة إعادة المحاولة
  errorMessage?: string; // رسالة الخطأ
}

// مكون لعرض خطأ تحميل الصورة بشكل أكثر فائدة
const ImageErrorDisplay = ({ onRetry, errorMessage }: ImageErrorDisplayProps) => {
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
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;

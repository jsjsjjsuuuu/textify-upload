
import { useState, useEffect } from "react";
import { ImageOff, RefreshCw, AlertTriangle, Wifi, ImagePlus } from "lucide-react";

interface ImageErrorHandlerProps {
  imageId: string;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
  isLoading?: boolean;
  className?: string;
  errorMessage?: string;
  retryMessage?: string;
  loadingMessage?: string;
  errorType?: "network" | "format" | "access" | "general";
  fadeIn?: boolean;
}

const ImageErrorHandler = ({
  imageId,
  onRetry,
  retryCount = 0,
  maxRetries = 2,
  isLoading = false,
  className = "",
  errorMessage = "الصورة غير متاحة حاليًا",
  retryMessage = "إعادة المحاولة",
  loadingMessage = "جاري إعادة التحميل...",
  errorType = "general",
  fadeIn = true
}: ImageErrorHandlerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!fadeIn);
  
  // إعادة ضبط حالة الخطأ عند تغيير معرف الصورة
  useEffect(() => {
    setError(null);
  }, [imageId]);
  
  // تأثير الظهور التدريجي
  useEffect(() => {
    if (fadeIn) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [fadeIn]);
  
  // تحديد ما إذا كان يجب عرض زر إعادة المحاولة
  const shouldShowRetryButton = !isLoading && (errorType !== "access" || retryCount < maxRetries);
  
  // اختيار الأيقونة والرسالة المناسبة حسب نوع الخطأ
  const getErrorIcon = () => {
    switch (errorType) {
      case "network":
        return <Wifi className="w-8 h-8 text-amber-500 mb-2" />;
      case "format":
        return <ImagePlus className="w-8 h-8 text-amber-500 mb-2" />;
      case "access":
        return <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />;
      default:
        return <ImageOff className="w-8 h-8 text-red-500 mb-2" />;
    }
  };
  
  // الحصول على الرسالة المناسبة حسب نوع الخطأ
  const getErrorMessageByType = () => {
    if (errorMessage !== "الصورة غير متاحة حاليًا") return errorMessage;
    
    switch (errorType) {
      case "network":
        return "خطأ في الاتصال بالشبكة";
      case "format":
        return "تنسيق الصورة غير مدعوم";
      case "access":
        return "خطأ في الوصول للصورة";
      default:
        return "الصورة غير متاحة حاليًا";
    }
  };
  
  return (
    <div 
      className={`absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 ${className} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-xs text-blue-500">{loadingMessage}</p>
          {retryCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              محاولة {retryCount}/{maxRetries}
            </p>
          )}
        </>
      ) : (
        <>
          {getErrorIcon()}
          <p className="mt-1 text-sm text-center text-muted-foreground">{getErrorMessageByType()}</p>
          <p className="text-xs text-center text-muted-foreground mb-2">
            {retryCount > 0 ? `عدد المحاولات: ${retryCount}` : 'فشل التحميل'}
          </p>
          {shouldShowRetryButton ? (
            <button 
              onClick={onRetry} 
              className="mt-1 px-4 py-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              {retryMessage}
            </button>
          ) : errorType === "access" ? (
            <p className="text-xs text-amber-500 mt-1">
              تعذر الوصول للصورة، يرجى التحقق من الإذن
            </p>
          ) : (
            <div className="flex items-center justify-center mt-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="mr-2 text-xs text-blue-500">{loadingMessage}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageErrorHandler;

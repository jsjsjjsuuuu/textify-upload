
import React, { useState } from "react";
import { Search } from "lucide-react";
import ImageErrorHandler from "@/components/common/ImageErrorHandler";

interface ImagePreviewCellProps {
  imageId: string;
  previewUrl: string;
  onClick: () => void;
}

const ImagePreviewCell: React.FC<ImagePreviewCellProps> = ({ imageId, previewUrl, onClick }) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<"network" | "format" | "access" | "general">("general");

  const handleImageError = () => {
    setImgError(true);
    
    // تحديد نوع الخطأ استنادًا إلى حالة الاتصال
    if (!navigator.onLine) {
      setErrorType("network");
    } else if (retryCount >= 2) {
      setErrorType("access");
    }
    
    // تحديث عداد المحاولات
    const currentRetryCount = retryCount;
    if (currentRetryCount < 2) {
      // محاولة إعادة التحميل تلقائيًا
      handleRetryImage();
    } else {
      setIsRetrying(false);
    }
  };

  const handleRetryImage = () => {
    // تحديث نوع الخطأ إذا تغيرت حالة الاتصال
    if (!navigator.onLine) {
      setErrorType("network");
    } else {
      setErrorType("general");
    }
    
    // تحديث عداد المحاولات
    setRetryCount(prev => prev + 1);
    
    // تعيين حالة المحاولة
    setIsRetrying(true);
    
    // إعادة المحاولة بعد تأخير قصير
    setTimeout(() => {
      setImgError(false);
      
      // إعادة تعيين حالة المحاولة بعد فترة زمنية في حالة فشل التحميل
      setTimeout(() => {
        setIsRetrying(false);
      }, 5000); // انتظر 5 ثوانٍ كحد أقصى
    }, 100);
  };

  return (
    <div 
      className="w-20 h-20 rounded-lg overflow-hidden bg-transparent cursor-pointer border-2 border-border/40 dark:border-gray-700/40 transition-transform hover:scale-105 group shadow-sm hover:shadow-md relative" 
      onClick={() => !imgError && onClick()}
    >
      {!imgError ? (
        <>
          <img 
            src={previewUrl} 
            alt="صورة مصغرة" 
            className="object-contain h-full w-full transition-transform duration-200 group-hover:scale-110" 
            style={{ mixBlendMode: 'multiply' }} 
            onError={handleImageError}
            crossOrigin="anonymous"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Search className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </>
      ) : (
        <ImageErrorHandler 
          imageId={imageId}
          onRetry={handleRetryImage}
          retryCount={retryCount}
          maxRetries={2}
          isLoading={isRetrying}
          className="rounded-lg !p-2"
          errorMessage="غير متاح"
          retryMessage="إعادة"
          loadingMessage="تحميل..."
          errorType={errorType}
          fadeIn={true}
        />
      )}
    </div>
  );
};

export default ImagePreviewCell;

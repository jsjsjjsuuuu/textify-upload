
import React from 'react';
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageErrorDisplayProps {
  onRetry?: () => void;
  errorMessage?: string;
  retryCount?: number;
}

const ImageErrorDisplay = ({ onRetry, errorMessage, retryCount = 0 }: ImageErrorDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
        تعذر تحميل الصورة
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">
        {errorMessage || "حدث خطأ أثناء تحميل الصورة. قد يكون الملف تالفًا أو غير متاح."}
      </p>
      
      {retryCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          عدد محاولات إعادة التحميل: {retryCount}
        </p>
      )}
      
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-2 gap-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20" 
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;


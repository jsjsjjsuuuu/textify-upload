
import React, { useState, useEffect } from 'react';
import { ImageData } from '@/types/ImageData';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  image: ImageData;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ image, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // إعادة تعيين حالة الخطأ عند تغيير الصورة
  useEffect(() => {
    setImgError(false);
    setZoomLevel(1);
    setRetryCount(0);
  }, [image.id]);
  
  // زيادة مستوى التكبير
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  // تقليل مستوى التكبير
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // إعادة تعيين مستوى التكبير
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  // إعادة تحميل الصورة في حالة الخطأ
  const handleRetryLoading = () => {
    setImgError(false);
    setRetryCount(prev => prev + 1);
  };
  
  // معالجة أخطاء تحميل الصورة
  const handleImgError = () => {
    setImgError(true);
  };
  
  // تنسيق الوقت والتاريخ
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-AE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* رأس العارض */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {image.file?.name || "صورة"}
            {image.number && <span className="text-sm text-muted-foreground mr-2">#{image.number}</span>}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* محتوى العارض */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* جزء الصورة */}
          <div className="w-full md:w-1/2 p-4 flex items-center justify-center relative overflow-hidden">
            <div className="overflow-auto w-full h-full flex items-center justify-center">
              {!imgError ? (
                <img
                  src={`${image.previewUrl}?t=${retryCount}`}
                  alt={image.file?.name || "صورة"}
                  className="object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onError={handleImgError}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full mb-4">
                    <RefreshCw className="h-10 w-10 text-red-500" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">فشل في تحميل الصورة</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    قد تكون الصورة غير متاحة أو تم حذفها من الخادم
                  </p>
                  <Button variant="outline" onClick={handleRetryLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة المحاولة {retryCount > 0 && `(${retryCount})`}
                  </Button>
                </div>
              )}
            </div>
            
            {/* أزرار التكبير */}
            {!imgError && (
              <div className="absolute bottom-4 right-4 flex bg-white dark:bg-gray-700 rounded-md shadow p-1">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleResetZoom} disabled={zoomLevel === 1}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* جزء البيانات */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">النص المستخرج</h4>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md max-h-32 overflow-y-auto">
                  {image.extractedText || "لم يتم استخراج نص"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">الكود</h4>
                  <p className="text-sm">{image.code || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">اسم المرسل</h4>
                  <p className="text-sm">{image.senderName || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">رقم الهاتف</h4>
                  <p className="text-sm">{image.phoneNumber || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">السعر</h4>
                  <p className="text-sm">{image.price || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">اسم الشركة</h4>
                  <p className="text-sm">{image.companyName || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">المحافظة</h4>
                  <p className="text-sm">{image.province || "—"}</p>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex flex-wrap gap-2 my-2">
                  {image.date && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {formatDate(image.date)}
                    </span>
                  )}
                  {image.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${image.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                      image.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' : 
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'}`}>
                      {image.status === 'completed' ? 'مكتمل' : 
                       image.status === 'error' ? 'خطأ' : 
                       image.status === 'processing' ? 'قيد المعالجة' : 'معلق'}
                    </span>
                  )}
                  {image.confidence && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                      الدقة: {image.confidence}%
                    </span>
                  )}
                  {image.extractionMethod && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                      {image.extractionMethod === 'gemini' ? 'Gemini AI' : 'OCR'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;

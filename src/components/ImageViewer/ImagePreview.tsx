import React, { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { RefreshCw, AlertCircle } from "lucide-react"; 
import { supabase } from "@/integrations/supabase/client";
import ImageErrorDisplay from "@/components/ImagePreview/ImageViewer/ImageErrorDisplay";

interface ImagePreviewProps {
  image: ImageData;
  onImageClick?: (image: ImageData) => void;
  onReprocess?: (image: ImageData) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onImageClick, onReprocess }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // إعداد مصدر الصورة عند تحميل المكون
  useEffect(() => {
    const setupImageSource = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        // إذا كان هناك مسار تخزين في Supabase
        if (image.storage_path) {
          console.log(`محاولة استخدام storage_path للصورة ${image.id}: ${image.storage_path}`);
          
          const { data } = await supabase.storage
            .from('receipt_images')
            .getPublicUrl(image.storage_path);
          
          if (data?.publicUrl) {
            console.log(`تم جلب عنوان Supabase للصورة ${image.id}: ${data.publicUrl}`);
            setPreviewUrl(`${data.publicUrl}?t=${Date.now()}`);
            return;
          }
        }
        
        // إذا كان هناك previewUrl، استخدمه
        if (image.previewUrl) {
          console.log(`استخدام previewUrl للصورة ${image.id}: ${image.previewUrl}`);
          setPreviewUrl(image.previewUrl);
          return;
        }
        
        // محاولة إنشاء URL من كائن الملف
        if (image.file) {
          console.log(`إنشاء objectURL من كائن الملف للصورة ${image.id}`);
          const objectUrl = URL.createObjectURL(image.file);
          setPreviewUrl(objectUrl);
          return;
        }
        
        // لا توجد مصادر للصورة
        console.log(`لا توجد مصادر صور متاحة للصورة ${image.id}`);
        setIsError(true);
        setPreviewUrl('/placeholder-image.jpg');
      } catch (error) {
        console.error(`خطأ في إعداد مصدر الصورة ${image.id}:`, error);
        setIsError(true);
        setPreviewUrl('/placeholder-image.jpg');
      } finally {
        setIsLoading(false);
      }
    };
    
    setupImageSource();
    
    // تنظيف عناوين URL الموضوعية عند تفكيك المكون
    return () => {
      if (previewUrl && !image.previewUrl && !image.storage_path && previewUrl !== '/placeholder-image.jpg') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [image.id, image.previewUrl, image.storage_path, image.file]);
  
  const handleRetry = useCallback(() => {
    console.log(`إعادة محاولة تحميل الصورة: ${image.id} - محاولة رقم: ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setIsError(false);
    
    // إعادة جلب الصورة مع تجنب التخزين المؤقت
    if (image.storage_path) {
      try {
        const { data } = supabase.storage
          .from('receipt_images')
          .getPublicUrl(image.storage_path);
        
        if (data?.publicUrl) {
          setPreviewUrl(`${data.publicUrl}?retry=${Date.now()}`);
        }
      } catch (error) {
        console.error('خطأ في جلب رابط Supabase أثناء إعادة المحاولة:', error);
      }
    } else if (image.previewUrl) {
      // تحديث الصورة بإضافة معلمة عشوائية لتجنب التخزين المؤقت
      const baseUrl = image.previewUrl.split('?')[0];
      setPreviewUrl(`${baseUrl}?retry=${Date.now()}`);
    } else if (image.file) {
      // إعادة إنشاء URL الموضوع من الملف
      try {
        const objectUrl = URL.createObjectURL(image.file);
        setPreviewUrl(objectUrl);
      } catch (error) {
        console.error('خطأ في إعادة إنشاء objectURL:', error);
        setPreviewUrl('/placeholder-image.jpg');
      }
    }
    
    setIsLoading(false);
  }, [image.previewUrl, image.storage_path, image.file, image.id, retryCount]);
  
  const handleClick = () => {
    if (onImageClick) {
      onImageClick(image);
    }
  };
  
  const handleReprocess = (e: React.MouseEvent) => {
    e.stopPropagation(); // منع انتشار الحدث للعنصر الأب
    if (onReprocess) {
      onReprocess(image);
    }
  };
  
  const handleImageLoad = () => {
    console.log(`تم تحميل الصورة بنجاح: ${image.id}`);
    setIsLoading(false);
    setIsError(false);
  };
  
  const handleImageError = () => {
    console.error(`فشل تحميل الصورة: ${image.id}`);
    setIsLoading(false);
    setIsError(true);
  };
  
  // تحديد نص الحالة بناءً على حالة الصورة
  const getStatusBadge = () => {
    if (image.status === "pending") {
      return <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-2 py-0.5 rounded text-xs">قيد الانتظار</div>;
    } else if (image.status === "processing") {
      return <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-0.5 rounded text-xs flex items-center">
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        قيد المعالجة
      </div>;
    } else if (image.status === "error") {
      return <div className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-0.5 rounded text-xs flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        فشل
      </div>;
    } else if (image.status === "completed") {
      return <div className="absolute top-2 right-2 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs">مكتملة</div>;
    }
    return null;
  };

  // التحقق من اكتمال البيانات المستخرجة
  const hasCompleteData = image.code && image.senderName && image.phoneNumber && image.price;
  
  // تحديد ما إذا كان يجب إظهار زر إعادة المعالجة
  const shouldShowReprocessButton = (onReprocess && 
    (image.status === "error" || 
     (image.status === "completed" && !hasCompleteData))
  );

  return (
    <div 
      className="relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {isError ? (
        <div className="w-full h-[300px]">
          <ImageErrorDisplay
            onRetry={handleRetry}
            retryCount={retryCount}
            errorMessage="تعذر تحميل الصورة"
          />
        </div>
      ) : (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="animate-pulse w-8 h-8 rounded-full bg-muted/50"></div>
            </div>
          )}
          <img 
            src={previewUrl} 
            alt={`صورة ${image.id}`} 
            className="w-full h-auto object-contain rounded max-h-[300px] group-hover:opacity-95 transition-opacity"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{opacity: isLoading ? 0 : 1}}
          />
        </div>
      )}
      
      {getStatusBadge()}
      
      {image.number && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
          صورة {image.number}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded truncate max-w-[70%]">
        {image.file?.name || image.id.substring(0, 8)}
      </div>
      
      {/* تحسين عرض حالة الخطأ */}
      {image.status === "error" && !isError && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            فشل في معالجة الصورة
          </div>
        </div>
      )}
      
      {/* تحسين زر إعادة المعالجة - ظهور أكثر وضوحاً عند الحاجة */}
      {shouldShowReprocessButton && (
        <div className="absolute top-10 left-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-sm flex items-center justify-center"
            onClick={handleReprocess}
            title="إعادة معالجة الصورة"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}
      
      {/* عرض مؤشر إضافي لحالة البيانات غير المكتملة */}
      {image.status === "completed" && !hasCompleteData && (
        <div className="absolute bottom-10 right-2 bg-amber-500/90 text-white px-1.5 py-0.5 rounded text-[10px] flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          بيانات ناقصة
        </div>
      )}
      
      {/* عرض مؤشر لمستوى الثقة إذا كان متوفراً */}
      {image.confidence && image.status === "completed" && (
        <div className="absolute top-10 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px]">
          الدقة: {image.confidence}%
        </div>
      )}
    </div>
  );
};

export default ImagePreview;


import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";
import ImageInfoBadges from "./ImageInfoBadges";
import ImageErrorDisplay from "./ImageErrorDisplay";
import DraggableImage from "./DraggableImage";
import { supabase } from "@/integrations/supabase/client";

interface ImageViewerProps {
  selectedImage: ImageData;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  formatDate: (date: Date) => string;
}

const ImageViewer = ({
  selectedImage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  formatDate
}: ImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // تحسين طريقة جلب الصور وتحديد مصدرها
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
    setRetryCount(0);
    
    const getImageSource = async () => {
      try {
        // محاولة استخدام storage_path أولاً إذا كان موجودًا
        if (selectedImage.storage_path) {
          console.log(`محاولة استخدام storage_path للصورة ${selectedImage.id}: ${selectedImage.storage_path}`);
          
          const { data } = await supabase.storage
            .from('receipt_images')
            .getPublicUrl(selectedImage.storage_path);
          
          if (data?.publicUrl) {
            console.log(`تم جلب عنوان Supabase للصورة ${selectedImage.id}: ${data.publicUrl}`);
            setImageSrc(`${data.publicUrl}?t=${Date.now()}`);
            return;
          }
        }
        
        // استخدام previewUrl كبديل إذا كان متوفرًا
        if (selectedImage.previewUrl) {
          console.log(`استخدام previewUrl للصورة ${selectedImage.id}: ${selectedImage.previewUrl}`);
          setImageSrc(selectedImage.previewUrl);
          return;
        }
        
        // محاولة إنشاء URL من كائن الملف إذا كان متوفرًا
        if (selectedImage.file) {
          console.log(`إنشاء objectURL من كائن الملف للصورة ${selectedImage.id}`);
          const objectUrl = URL.createObjectURL(selectedImage.file);
          setImageSrc(objectUrl);
          return;
        }
        
        // لا توجد مصادر للصورة
        console.log(`لا توجد مصادر صور متاحة للصورة ${selectedImage.id}`);
        setImageSrc(null);
        setImgError(true);
      } catch (error) {
        console.error('خطأ في جلب مصدر الصورة:', error);
        setImgError(true);
      }
    };
    
    getImageSource();
    
    // تنظيف عناوين URL الموضوعية عند تفكيك المكون
    return () => {
      if (imageSrc && !selectedImage.previewUrl && !selectedImage.storage_path) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [selectedImage.id, selectedImage.previewUrl, selectedImage.storage_path, selectedImage.file]);

  const handleImageLoad = useCallback(() => {
    console.log(`تم تحميل الصورة ${selectedImage.id} بنجاح`);
    setImageLoaded(true);
    setImgError(false);
  }, [selectedImage.id]);

  const handleImageError = useCallback(() => {
    console.error(`فشل تحميل الصورة ${selectedImage.id}`);
    setImageLoaded(false);
    setImgError(true);
  }, [selectedImage.id]);

  // تحسين وظيفة إعادة المحاولة
  const handleRetry = useCallback(() => {
    console.log(`إعادة محاولة تحميل الصورة ${selectedImage.id} (المحاولة رقم ${retryCount + 1})`);
    setImgError(false);
    setRetryCount(prev => prev + 1);
    
    // إعادة جلب الصورة مع تجنب التخزين المؤقت
    if (selectedImage.storage_path) {
      try {
        const { data } = supabase.storage
          .from('receipt_images')
          .getPublicUrl(selectedImage.storage_path);
        
        if (data?.publicUrl) {
          setImageSrc(`${data.publicUrl}?retry=${Date.now()}`);
        }
      } catch (error) {
        console.error('خطأ في جلب رابط Supabase أثناء إعادة المحاولة:', error);
      }
    } else if (selectedImage.previewUrl) {
      // تحديث الصورة بإضافة معلمة عشوائية لتجنب التخزين المؤقت
      const baseUrl = selectedImage.previewUrl.split('?')[0];
      setImageSrc(`${baseUrl}?retry=${Date.now()}`);
    } else if (selectedImage.file) {
      // إعادة إنشاء URL الموضوع من الملف
      try {
        const objectUrl = URL.createObjectURL(selectedImage.file);
        setImageSrc(objectUrl);
      } catch (error) {
        console.error('خطأ في إعادة إنشاء objectURL:', error);
      }
    }
  }, [selectedImage.previewUrl, selectedImage.storage_path, selectedImage.file, selectedImage.id, retryCount]);

  // تحديد حالة البوكماركلت للعرض
  const getBookmarkletStatusBadge = () => {
    if (!selectedImage.bookmarkletStatus) return null;
    
    const statusClasses = {
      ready: "bg-blue-500/20 text-blue-700 border-blue-300",
      pending: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
      success: "bg-green-500/20 text-green-700 border-green-300",
      error: "bg-red-500/20 text-red-700 border-red-300"
    };
    
    const statusText = {
      ready: "جاهز للإدخال",
      pending: "قيد الإدخال",
      success: "تم الإدخال",
      error: "فشل الإدخال"
    };
    
    return (
      <div className={`absolute bottom-16 right-4 px-3 py-1 rounded-full text-xs font-medium border ${statusClasses[selectedImage.bookmarkletStatus]} shadow-sm`}>
        {statusText[selectedImage.bookmarkletStatus]}
        {selectedImage.bookmarkletMessage && (
          <span className="block text-[10px] mt-0.5 opacity-80 max-w-40 truncate">
            {selectedImage.bookmarkletMessage}
          </span>
        )}
      </div>
    );
  };

  // تحسين عرض الخطأ لاستخدام وظيفة إعادة المحاولة
  const renderErrorDisplay = () => {
    return (
      <div className="overflow-hidden relative h-[550px] w-full flex items-center justify-center bg-transparent rounded-md">
        <ImageErrorDisplay 
          onRetry={handleRetry} 
          retryCount={retryCount}
          errorMessage={selectedImage.status === "error" ? "حدث خطأ أثناء معالجة الصورة. يمكنك إعادة المحاولة." : "تعذر تحميل الصورة. يمكنك إعادة المحاولة."}
        />
      </div>
    );
  };

  return (
    <div className="col-span-1 bg-transparent rounded-lg p-4 flex flex-col items-center justify-center relative">
      {!imgError && imageSrc ? (
        <DraggableImage 
          src={imageSrc} 
          zoomLevel={zoomLevel}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          imageLoaded={imageLoaded}
        />
      ) : (
        renderErrorDisplay()
      )}
      
      <ZoomControls 
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
      
      {getBookmarkletStatusBadge()}
      
      <ImageInfoBadges 
        number={selectedImage.number}
        date={selectedImage.date}
        confidence={selectedImage.confidence}
        extractionMethod={selectedImage.extractionMethod || "none"}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ImageViewer;

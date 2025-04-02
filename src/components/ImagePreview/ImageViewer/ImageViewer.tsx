
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
  
  // Reset image loaded state and get image URL when selected image changes
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
    setRetryCount(0);
    
    const getImageSource = async () => {
      // إذا كان هناك مسار تخزين، استخدم Supabase Storage
      if (selectedImage.storage_path) {
        try {
          const { data } = supabase.storage
            .from('receipt_images')
            .getPublicUrl(selectedImage.storage_path);
          
          if (data?.publicUrl) {
            console.log(`تم جلب عنوان Supabase للصورة ${selectedImage.id}: ${data.publicUrl}`);
            setImageSrc(`${data.publicUrl}?t=${Date.now()}`);
            return;
          }
        } catch (error) {
          console.error('خطأ في جلب رابط Supabase:', error);
        }
      }
      
      // إذا كان هناك previewUrl، استخدمه
      if (selectedImage.previewUrl) {
        console.log(`استخدام previewUrl للصورة ${selectedImage.id}: ${selectedImage.previewUrl}`);
        setImageSrc(selectedImage.previewUrl);
        return;
      }
      
      // استخدام صورة بديلة
      console.log(`لا توجد صورة متاحة للصورة ${selectedImage.id}`);
      setImageSrc(null);
      setImgError(true);
    };
    
    getImageSource();
  }, [selectedImage.id, selectedImage.previewUrl, selectedImage.storage_path]);

  const handleImageLoad = () => {
    console.log(`تم تحميل الصورة ${selectedImage.id} بنجاح`);
    setImageLoaded(true);
    setImgError(false);
  };

  const handleImageError = () => {
    console.error(`فشل تحميل الصورة ${selectedImage.id}`);
    setImageLoaded(false);
    setImgError(true);
  };

  // وظيفة إعادة المحاولة
  const handleRetry = useCallback(() => {
    setImgError(false);
    setRetryCount(prev => prev + 1);
    
    // إعادة جلب الصورة مع تجنب التخزين المؤقت
    if (selectedImage.storage_path) {
      // إذا كان هناك مسار تخزين، استخدم Supabase Storage
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(selectedImage.storage_path);
      
      if (data?.publicUrl) {
        setImageSrc(`${data.publicUrl}?retry=${Date.now()}`);
      }
    } else if (selectedImage.previewUrl) {
      // تحديث الصورة بإضافة معلمة عشوائية لتجنب التخزين المؤقت
      setImageSrc(`${selectedImage.previewUrl.split('?')[0]}?retry=${Date.now()}`);
    }
  }, [selectedImage.previewUrl, selectedImage.storage_path]);

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
        extractionMethod={selectedImage.extractionMethod}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ImageViewer;

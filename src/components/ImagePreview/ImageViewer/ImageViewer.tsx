
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ZoomControls from "./ZoomControls";
import ImageInfoBadges from "./ImageInfoBadges";
import ImageErrorDisplay from "./ImageErrorDisplay";
import DraggableImage from "./DraggableImage";

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
  
  // إعادة تعيين حالة تحميل الصورة عند تغيير الصورة المحددة
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
  }, [selectedImage.id, selectedImage.previewUrl]);
  
  // الحصول على رابط الصورة أو استخدام البديل
  const getImageUrl = () => {
    if (!selectedImage.previewUrl || imgError) {
      return null;
    }
    return selectedImage.previewUrl;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImgError(true);
  };

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

  // نص تعليمات السحب في أسفل الصورة
  const getDragInstructions = () => {
    return (
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
        اسحب الصورة للتنقل بين أجزائها
      </div>
    );
  };

  return (
    <div className="col-span-1 bg-gray-900 dark:bg-gray-900 rounded-lg border border-purple-500/30 dark:border-purple-500/30 shadow-lg p-0 flex flex-col items-center justify-center relative overflow-hidden">
      {!imgError ? (
        <div className="relative w-full h-[550px] overflow-hidden flex items-center justify-center bg-gray-900 dark:bg-gray-900 border-0">
          {/* شريط أدوات التكبير العلوي */}
          <div className="absolute top-2 left-2 z-10 flex space-x-2 rtl:space-x-reverse">
            <button onClick={onZoomIn} className="w-8 h-8 bg-gray-900/70 hover:bg-gray-800/90 text-white rounded-full flex items-center justify-center border border-gray-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
            <button onClick={onZoomOut} className="w-8 h-8 bg-gray-900/70 hover:bg-gray-800/90 text-white rounded-full flex items-center justify-center border border-gray-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
            <button onClick={onResetZoom} className="w-8 h-8 bg-gray-900/70 hover:bg-gray-800/90 text-white rounded-full flex items-center justify-center border border-gray-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
            </button>
          </div>
          
          {/* إطار الصورة مع بوردر بنفسجي */}
          <div className="w-full h-full max-w-[95%] max-h-[95%] relative flex items-center justify-center border-4 border-purple-500/30 rounded-lg overflow-hidden">
            <DraggableImage 
              src={getImageUrl()} 
              zoomLevel={zoomLevel}
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
              imageLoaded={imageLoaded}
            />

            {/* نسبة التكبير */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs py-1 px-2 rounded-md">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden relative h-[550px] w-full flex items-center justify-center bg-gray-900 dark:bg-gray-900 rounded-md">
          <ImageErrorDisplay />
        </div>
      )}
      
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


import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import ImageInfoBadges from "./ImageInfoBadges";
import ImageErrorDisplay from "./ImageErrorDisplay";
import DraggableImage from "./DraggableImage";
import { Button } from "@/components/ui/button";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageViewerProps {
  selectedImage: ImageData;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomChange?: (newZoom: number) => void;
  formatDate: (date: Date) => string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

const ImageViewer = ({
  selectedImage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomChange,
  formatDate,
  isFullScreen,
  onToggleFullScreen
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

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-900 dark:to-black rounded-lg border border-purple-600/40 shadow-xl overflow-hidden flex flex-col h-full">
      {!imgError ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-gray-900 dark:bg-gray-900">
          {/* إطار الصورة مع بوردر بنفسجي */}
          <div className="w-full h-full relative flex items-center justify-center border-4 border-purple-700/30 rounded-lg overflow-hidden">
            <DraggableImage 
              src={getImageUrl()} 
              zoomLevel={zoomLevel}
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
              imageLoaded={imageLoaded}
              onZoomChange={onZoomChange}
            />
          </div>
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* زر تكبير الشاشة كاملة */}
          {onToggleFullScreen && (
            <Button 
              onClick={onToggleFullScreen}
              className="absolute top-3 right-3 z-10 w-9 h-9 p-0 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full border border-gray-700/50"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden relative h-full w-full flex items-center justify-center bg-gray-900 dark:bg-gray-900 rounded-md">
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

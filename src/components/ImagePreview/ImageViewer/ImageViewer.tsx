
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
  
  // Reset image loaded state when selected image changes
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
  }, [selectedImage.id, selectedImage.previewUrl]);
  
  // Get safe image URL or fallback
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

  console.log("Rendering ImageViewer with image URL:", getImageUrl());

  return (
    <div className="col-span-1 bg-transparent rounded-lg p-4 flex flex-col items-center justify-center relative">
      {!imgError ? (
        <DraggableImage 
          src={getImageUrl()} 
          zoomLevel={zoomLevel}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          imageLoaded={imageLoaded}
        />
      ) : (
        <div className="overflow-hidden relative h-[550px] w-full flex items-center justify-center bg-transparent rounded-md">
          <ImageErrorDisplay />
        </div>
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

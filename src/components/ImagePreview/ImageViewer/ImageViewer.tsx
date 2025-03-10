
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

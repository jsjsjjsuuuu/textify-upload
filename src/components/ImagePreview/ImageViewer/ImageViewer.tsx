
import React, { useState, useEffect } from 'react';
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageData } from "@/types/ImageData";
import ImageInfoBadges from "./ImageInfoBadges";
import ImageErrorDisplay from "./ImageErrorDisplay";
import DraggableImage from "./DraggableImage";
import ZoomControls from "./ZoomControls";
import { motion, AnimatePresence } from "framer-motion";

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
  
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
  }, [selectedImage.id, selectedImage.previewUrl]);
  
  const getImageUrl = () => {
    if (!selectedImage.previewUrl || imgError) {
      return null;
    }
    return selectedImage.previewUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-900 dark:to-black rounded-lg border border-purple-600/40 shadow-xl overflow-hidden flex flex-col h-full"
    >
      {!imgError ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-gray-900 dark:bg-gray-900">
          {/* إطار الصورة مع بوردر بنفسجي */}
          <div className="w-full h-full relative flex items-center justify-center border-4 border-purple-700/30 rounded-lg overflow-hidden">
            <DraggableImage 
              src={getImageUrl()} 
              zoomLevel={zoomLevel}
              onImageLoad={() => setImageLoaded(true)}
              onImageError={() => {
                setImageLoaded(false);
                setImgError(true);
              }}
              imageLoaded={imageLoaded}
              onZoomChange={onZoomChange}
            />
          </div>
          
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
              >
                <div className="w-10 h-10 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* أزرار التحكم */}
          <ZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
            zoomLevel={zoomLevel}
          />
          
          {/* زر تكبير الشاشة كاملة */}
          {onToggleFullScreen && (
            <Button 
              onClick={onToggleFullScreen}
              size="icon"
              variant="ghost"
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full border border-gray-700/50"
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
      
      {selectedImage.bookmarkletStatus && (
        <div className={`absolute bottom-16 right-4 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${
          selectedImage.bookmarkletStatus === 'ready' ? 'bg-blue-500/20 text-blue-700 border-blue-300' :
          selectedImage.bookmarkletStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-300' :
          selectedImage.bookmarkletStatus === 'success' ? 'bg-green-500/20 text-green-700 border-green-300' :
          'bg-red-500/20 text-red-700 border-red-300'
        }`}>
          {selectedImage.bookmarkletStatus === 'ready' ? 'جاهز للإدخال' :
           selectedImage.bookmarkletStatus === 'pending' ? 'قيد الإدخال' :
           selectedImage.bookmarkletStatus === 'success' ? 'تم الإدخال' :
           'فشل الإدخال'}
          {selectedImage.bookmarkletMessage && (
            <span className="block text-[10px] mt-0.5 opacity-80 max-w-40 truncate">
              {selectedImage.bookmarkletMessage}
            </span>
          )}
        </div>
      )}
      
      <ImageInfoBadges 
        number={selectedImage.number}
        date={selectedImage.date}
        confidence={selectedImage.confidence}
        extractionMethod={selectedImage.extractionMethod}
        formatDate={formatDate}
      />
    </motion.div>
  );
};

export default ImageViewer;

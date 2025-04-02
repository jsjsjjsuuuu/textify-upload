
import React from "react";
import { ImageData } from "@/types/ImageData";

interface ImagePreviewProps {
  image: ImageData;
  onImageClick?: (image: ImageData) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onImageClick }) => {
  // إنشاء عنوان URL للمعاينة من الملف أو استخدام URL الموجود
  const previewUrl = image.previewUrl || '';
  
  const handleClick = () => {
    if (onImageClick) {
      onImageClick(image);
    }
  };

  return (
    <div 
      className="relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <img 
        src={previewUrl} 
        alt={`صورة ${image.id}`} 
        className="w-full h-auto object-contain rounded max-h-[300px]"
      />
      
      {image.status === "error" && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm">
            حدث خطأ أثناء المعالجة
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;

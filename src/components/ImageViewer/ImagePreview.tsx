
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
  
  // تحديد نص الحالة بناءً على حالة الصورة
  const getStatusBadge = () => {
    if (image.status === "pending") {
      return <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-2 py-0.5 rounded text-xs">قيد الانتظار</div>;
    } else if (image.status === "processing") {
      return <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-0.5 rounded text-xs">قيد المعالجة</div>;
    } else if (image.status === "error") {
      return <div className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-0.5 rounded text-xs">فشل</div>;
    } else if (image.status === "completed") {
      return <div className="absolute top-2 right-2 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs">مكتملة</div>;
    }
    return null;
  };

  return (
    <div 
      className="relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      <img 
        src={previewUrl} 
        alt={`صورة ${image.id}`} 
        className="w-full h-auto object-contain rounded max-h-[300px] group-hover:opacity-95 transition-opacity"
      />
      
      {getStatusBadge()}
      
      {image.number && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
          صورة {image.number}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded truncate max-w-[70%]">
        {image.fileName || image.id.substring(0, 8)}
      </div>
      
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

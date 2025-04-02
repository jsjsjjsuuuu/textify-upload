
import React from "react";
import { ImageData } from "@/types/ImageData";
import { RefreshCw } from "lucide-react"; // استيراد أيقونة إعادة المعالجة

interface ImagePreviewProps {
  image: ImageData;
  onImageClick?: (image: ImageData) => void;
  onReprocess?: (image: ImageData) => void; // إضافة وظيفة إعادة المعالجة
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onImageClick, onReprocess }) => {
  // إنشاء عنوان URL للمعاينة من الملف أو استخدام URL الموجود
  const previewUrl = image.previewUrl || '';
  
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
        onError={(e) => {
          // استخدام صورة بديلة في حالة فشل تحميل الصورة
          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
        }}
      />
      
      {getStatusBadge()}
      
      {image.number && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
          صورة {image.number}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded truncate max-w-[70%]">
        {image.file?.name || image.id.substring(0, 8)}
      </div>
      
      {image.status === "error" && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm">
            حدث خطأ أثناء المعالجة
          </div>
        </div>
      )}
      
      {/* زر إعادة المعالجة - يظهر فقط عند فشل المعالجة أو نجاحها مع نتائج ضعيفة */}
      {(image.status === "error" || (image.status === "completed" && (!image.code || !image.senderName || !image.phoneNumber))) && onReprocess && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-sm flex items-center justify-center"
            onClick={handleReprocess}
            title="إعادة معالجة الصورة"
          >
            <RefreshCw size={14} />
          </button>
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

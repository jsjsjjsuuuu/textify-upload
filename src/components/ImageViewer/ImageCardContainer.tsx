
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader } from 'lucide-react';

interface ImageCardContainerProps {
  images: ImageData[];
  activeImage: ImageData | null;
  selectedImages: string[];
  handleImageClick: (image: ImageData) => void;
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
  isImageComplete: (image: ImageData) => boolean;
  hasPhoneError: (image: ImageData) => boolean;
}

const ImageCardContainer = ({
  images,
  activeImage,
  selectedImages,
  handleImageClick,
  setSelectedImages,
  isImageComplete,
  hasPhoneError
}: ImageCardContainerProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AnimatePresence>
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative overflow-hidden rounded-lg cursor-pointer border-2 transition-all ${
              activeImage?.id === image.id 
                ? "border-primary dark:border-primary shadow-md" 
                : "border-transparent dark:border-transparent"
            } ${
              selectedImages.includes(image.id)
                ? "ring-2 ring-blue-500 dark:ring-blue-400"
                : ""
            }`}
            onClick={() => handleImageClick(image)}
          >
            {/* Checkbox للتحديد المتعدد */}
            <div 
              className="absolute top-2 right-2 z-10 w-5 h-5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImages(prev => 
                  prev.includes(image.id) 
                    ? prev.filter(id => id !== image.id)
                    : [...prev, image.id]
                );
              }}
            >
              {selectedImages.includes(image.id) && (
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              )}
            </div>
            
            {/* حالة الصورة */}
            <StatusBadge 
              status={image.status} 
              isComplete={isImageComplete(image)} 
              hasPhoneError={hasPhoneError(image)} 
            />
            
            {/* صورة مصغرة */}
            <ThumbnailImage image={image} />
            
            {/* معلومات الصورة */}
            <div className="p-2 text-xs">
              <p className="font-medium truncate">
                {image.code || image.senderName || `صورة ${image.number || ""}`}
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                {image.file?.name || ""}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// مكون فرعي لعرض حالة الصورة
const StatusBadge = ({ 
  status, 
  isComplete, 
  hasPhoneError 
}: { 
  status: "pending" | "processing" | "completed" | "error"; 
  isComplete: boolean; 
  hasPhoneError: boolean;
}) => {
  let badgeClass = '';
  let badgeText = '';
  
  if (status === "completed" && isComplete) {
    badgeClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    badgeText = "مكتملة";
  } else if (status === "pending") {
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    badgeText = "قيد الانتظار";
  } else if (status === "error" || hasPhoneError) {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    badgeText = hasPhoneError ? "خطأ في رقم الهاتف" : "فشل";
  } else if (status === "processing") {
    badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    badgeText = "جاري المعالجة";
  } else if (status === "completed" && !isComplete && !hasPhoneError) {
    badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    badgeText = "غير مكتملة";
  }
  
  return (
    <div className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 text-xs rounded-full ${badgeClass}`}>
      {status === "processing" ? (
        <span className="flex items-center">
          <Loader className="w-3 h-3 ml-1 animate-spin" />
          {badgeText}
        </span>
      ) : badgeText}
    </div>
  );
};

// مكون فرعي لعرض الصورة المصغرة
const ThumbnailImage = ({ image }: { image: ImageData }) => {
  return (
    <div className="h-28 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      {image.previewUrl ? (
        <img
          src={image.previewUrl}
          alt={`صورة ${image.number || ""}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // في حالة فشل تحميل الصورة، استبدالها بأيقونة
            (e.target as HTMLImageElement).style.display = "none";
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const icon = document.createElement("div");
              icon.className = "flex items-center justify-center h-full w-full";
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M2 2l20 20"></path><path d="M9 9v0"></path><path d="M6.5 5h11l2 2"></path><path d="M5.5 17.5l1 1"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>';
              parent.appendChild(icon);
            }
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ImageCardContainer;

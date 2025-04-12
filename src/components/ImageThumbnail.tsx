
import React from 'react';
import { ImageData } from "@/types/ImageData";
import { Image } from "lucide-react";
import { motion } from "framer-motion";
import LazyImage from "./LazyImage";

interface ImageThumbnailProps {
  image: ImageData;
  isActive: boolean;
  onClick: () => void;
  isImageComplete: (image: ImageData) => boolean;
  hasPhoneError: (image: ImageData) => boolean;
}

const ImageThumbnail = ({
  image,
  isActive,
  onClick,
  isImageComplete,
  hasPhoneError
}: ImageThumbnailProps) => {
  // تحديد لون شريط الحالة
  const getStatusBarColor = () => {
    if (image.status === "completed" && isImageComplete(image)) {
      return "bg-green-500";
    } else if (image.status === "pending") {
      return "bg-amber-500";
    } else if (image.status === "error" || hasPhoneError(image)) {
      return "bg-red-500";
    } else if (image.status === "processing") {
      return "bg-blue-500";
    } else if (image.status === "completed" && !isImageComplete(image) && !hasPhoneError(image)) {
      return "bg-purple-500";
    }
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-md cursor-pointer border-2 transition-all h-16
        ${isActive ? "border-primary dark:border-primary shadow-md" : "border-transparent dark:border-transparent"}`}
      onClick={onClick}
    >
      {/* شريط الحالة */}
      <div className={`absolute top-0 left-0 w-full h-1 ${getStatusBarColor()}`}></div>
      
      {/* الصورة المصغرة مع التحميل الكسول */}
      <div className="h-16 overflow-hidden flex items-center justify-center bg-[#0a0f1e]/80">
        {image.previewUrl ? (
          <LazyImage
            src={image.previewUrl}
            alt={`صورة ${image.number || ""}`}
            className="w-full h-full"
            onError={() => console.log(`فشل في تحميل الصورة المصغرة: ${image.id}`)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <Image className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(ImageThumbnail); // استخدام memo لتجنب إعادة التقديم غير الضرورية

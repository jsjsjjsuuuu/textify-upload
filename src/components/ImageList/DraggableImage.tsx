
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageData } from "@/types/ImageData";
import { CalendarIcon, Clock, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageErrorDisplay from "../ImagePreview/ImageViewer/ImageErrorDisplay";
import { supabase } from "@/integrations/supabase/client";

// صورة تعبئة افتراضية للصور التي لا يمكن تحميلها
const PLACEHOLDER_IMAGE_URL = '/placeholder-image.jpg';

interface DraggableImageProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
  image, 
  onImageClick,
  formatDate
}) => {
  const [isImageError, setIsImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageError = useCallback(() => {
    console.error(`فشل تحميل الصورة: ${image.id} - URL: ${image.previewUrl}`);
    setIsImageError(true);
    setIsImageLoading(false);
  }, [image.id, image.previewUrl]);

  const handleImageLoad = useCallback(() => {
    console.log(`تم تحميل الصورة بنجاح: ${image.id}`);
    setIsImageError(false);
    setIsImageLoading(false);
  }, [image.id]);

  const retryLoadImage = useCallback(() => {
    console.log(`إعادة محاولة تحميل الصورة: ${image.id} - محاولة رقم: ${retryCount + 1}`);
    setIsImageError(false);
    setIsImageLoading(true);
    setRetryCount(prev => prev + 1);
    
    if (image.storage_path) {
      // إذا كان هناك مسار تخزين، استخدم Supabase Storage
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(image.storage_path);
      
      if (data?.publicUrl) {
        // إضافة طابع زمني لمنع التخزين المؤقت
        image.previewUrl = `${data.publicUrl}?retry=${Date.now()}`;
      }
    } else {
      // تحديث الصورة بإضافة معلمة عشوائية لتجنب التخزين المؤقت
      image.previewUrl = image.previewUrl?.split('?')[0] + `?retry=${Date.now()}`;
    }
  }, [image, retryCount]);

  // لوضع صورة بديلة إذا كان عنوان URL للصورة غير صالح أو فارغًا
  const getImageSrc = useCallback(() => {
    // التحقق من وجود مسار تخزين
    if (image.storage_path) {
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(image.storage_path);
      
      if (data?.publicUrl) {
        return `${data.publicUrl}?t=${Date.now()}`;
      }
    }
    
    // التحقق مما إذا كان عنوان URL للصورة يبدأ بـ "blob:" وهو ما يسبب الخطأ
    if (image.previewUrl && image.previewUrl.startsWith('blob:')) {
      console.warn(`تم اكتشاف عنوان blob غير صالح للصورة: ${image.id}`);
      // استخدام صورة بديلة بدلاً من blob
      return PLACEHOLDER_IMAGE_URL;
    }
    
    return image.previewUrl || PLACEHOLDER_IMAGE_URL;
  }, [image.id, image.previewUrl, image.storage_path]);

  // تحديث العنوان عند التحميل الأولي
  useEffect(() => {
    console.log(`تهيئة الصورة: ${image.id} - URL: ${image.previewUrl}`);
  }, [image.id, image.previewUrl]);

  return (
    <div 
      className="relative cursor-pointer group h-[400px] flex flex-col" 
      onClick={() => onImageClick(image)}
    >
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <Badge 
          variant="outline" 
          className={`bg-white/90 hover:bg-white text-black px-2 py-1 text-xs rounded-full backdrop-blur-sm ${
            image.status === "completed" ? "border-green-500" : 
            image.status === "processing" ? "border-blue-500" : 
            "border-gray-300"
          }`}
        >
          {image.status === "completed" ? "مكتمل" : 
           image.status === "processing" ? "جاري المعالجة" : 
           "جديد"}
        </Badge>
        
        {image.submitted && (
          <Badge variant="outline" className="bg-green-500/90 hover:bg-green-500 text-white px-2 py-1 text-xs rounded-full">
            تم الإرسال
          </Badge>
        )}
      </div>
      
      <div className="overflow-hidden flex-grow bg-muted/10 dark:bg-muted/5 relative rounded-t-lg">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/5">
            <div className="animate-pulse w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </div>
        )}
        
        {isImageError ? (
          <ImageErrorDisplay 
            onRetry={retryLoadImage} 
            retryCount={retryCount}
            errorMessage="تعذر تحميل الصورة. انقر لإعادة المحاولة."
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="relative h-full"
          >
            <img 
              src={getImageSrc()}
              alt={`صورة ${image.id}`}
              className="object-contain w-full h-full"
              style={{ opacity: isImageLoading ? 0 : 1 }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.div>
        )}
      </div>
      
      <div className="p-3 bg-card dark:bg-card/80 text-xs text-muted-foreground flex justify-between items-center rounded-b-lg border-t border-muted/20">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{formatDate(image.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{image.date.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default DraggableImage;

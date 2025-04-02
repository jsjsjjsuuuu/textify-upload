
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
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // تعيين مصدر الصورة عند التحميل الأولي
  useEffect(() => {
    const initImageSource = () => {
      if (image.storage_path) {
        // إذا كان هناك مسار تخزين، استخدم Supabase Storage
        try {
          const { data } = supabase.storage
            .from('receipt_images')
            .getPublicUrl(image.storage_path);
          
          if (data?.publicUrl) {
            console.log(`تم جلب عنوان Supabase للصورة ${image.id}: ${data.publicUrl}`);
            setImageSrc(`${data.publicUrl}?t=${Date.now()}`);
            return;
          }
        } catch (error) {
          console.error('خطأ في جلب رابط Supabase:', error);
        }
      }
      
      // إذا كان هناك previewUrl، استخدمه
      if (image.previewUrl) {
        console.log(`استخدام previewUrl للصورة ${image.id}: ${image.previewUrl}`);
        setImageSrc(image.previewUrl);
        return;
      }
      
      // استخدام صورة بديلة
      console.log(`استخدام صورة بديلة للصورة ${image.id}`);
      setImageSrc(PLACEHOLDER_IMAGE_URL);
    };
    
    initImageSource();
  }, [image.id, image.previewUrl, image.storage_path]);

  const handleImageError = useCallback(() => {
    console.error(`فشل تحميل الصورة: ${image.id} - URL: ${imageSrc}`);
    setIsImageError(true);
    setIsImageLoading(false);
  }, [image.id, imageSrc]);

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
    
    // إعادة جلب الصورة مع تجنب التخزين المؤقت
    if (image.storage_path) {
      // إذا كان هناك مسار تخزين، استخدم Supabase Storage
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(image.storage_path);
      
      if (data?.publicUrl) {
        setImageSrc(`${data.publicUrl}?retry=${Date.now()}`);
      }
    } else if (image.previewUrl) {
      // تحديث الصورة بإضافة معلمة عشوائية لتجنب التخزين المؤقت
      setImageSrc(`${image.previewUrl.split('?')[0]}?retry=${Date.now()}`);
    } else {
      // استخدام صورة بديلة
      setImageSrc(`${PLACEHOLDER_IMAGE_URL}?t=${Date.now()}`);
    }
  }, [image.previewUrl, image.storage_path, image.id, retryCount]);

  return (
    <div 
      className="relative cursor-pointer group h-[400px] flex flex-col" 
      onClick={() => onImageClick(image)}
    >
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <Badge 
          variant="outline" 
          className={`bg-white/90 hover:bg-white text-black px-2 py-1 text-xs backdrop-blur-sm ${
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
          <Badge variant="outline" className="bg-green-500/90 hover:bg-green-500 text-white px-2 py-1 text-xs">
            تم الإرسال
          </Badge>
        )}
      </div>
      
      <div className="overflow-hidden flex-grow bg-muted/20 relative">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="animate-pulse w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
            {imageSrc && (
              <img 
                src={imageSrc}
                alt={`صورة ${image.id}`}
                className="object-contain w-full h-full"
                style={{ opacity: isImageLoading ? 0 : 1 }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </motion.div>
        )}
      </div>
      
      <div className="p-3 bg-white dark:bg-gray-800 text-xs text-muted-foreground flex justify-between items-center">
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

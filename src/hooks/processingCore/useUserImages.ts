
import { useCallback, useState } from "react";
import type { ImageData } from "@/types/ImageData";

interface UserImagesProps {
  loadUserImages: (userId: string, callback?: (images: ImageData[]) => void) => Promise<void>;
  setAllImages: (images: ImageData[]) => void;
  hiddenImageIds: string[];
}

export const useUserImages = ({
  loadUserImages, 
  setAllImages,
  hiddenImageIds
}: UserImagesProps) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);

  /**
   * تحميل صور المستخدم - واجهة مبسطة تستخدم دالة الرجوع فقط
   * @param userId معرف المستخدم
   * @param callback - دالة الرجوع التي ستتلقى الصور المحملة
   */
  const loadImages = useCallback((userId: string, callback?: (images: ImageData[]) => void) => {
    if (!userId) return;
    
    setIsLoadingUserImages(true);
    // استدعاء دالة loadUserImages مع تمرير معرف المستخدم ودالة الرجوع
    return loadUserImages(userId, (loadedImages) => {
      // تصفية الصور المخفية قبل إضافتها للعرض
      const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
      if (callback) {
        callback(visibleImages);
      } else {
        setAllImages(visibleImages);
      }
      setIsLoadingUserImages(false);
    });
  }, [loadUserImages, hiddenImageIds, setAllImages]);

  return {
    isLoadingUserImages,
    loadUserImages: loadImages
  };
};

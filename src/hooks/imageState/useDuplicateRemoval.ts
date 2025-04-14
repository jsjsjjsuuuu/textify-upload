
import { useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

/**
 * هوك لإزالة التكرارات من مجموعة الصور
 * @param images مجموعة الصور الحالية
 * @param setImages دالة تعيين مجموعة الصور
 */
export const useDuplicateRemoval = (
  images: ImageData[],
  setImages: (images: ImageData[]) => void
) => {
  // إزالة الصور المكررة بناءً على المعرف
  const removeDuplicates = useCallback(() => {
    const uniqueIds = new Set<string>();
    const uniqueImages: ImageData[] = [];
    
    images.forEach(image => {
      if (!uniqueIds.has(image.id)) {
        uniqueIds.add(image.id);
        uniqueImages.push(image);
      }
    });
    
    // إذا كان هناك تكرارات، قم بتحديث القائمة
    if (uniqueImages.length < images.length) {
      setImages(uniqueImages);
      return images.length - uniqueImages.length; // عدد الصور المكررة التي تمت إزالتها
    }
    
    return 0; // لم تتم إزالة أي صور
  }, [images, setImages]);
  
  return { removeDuplicates };
};

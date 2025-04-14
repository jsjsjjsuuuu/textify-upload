
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
  const removeDuplicates = useCallback(() => {
    const uniqueIds = new Set<string>();
    const uniqueImages: ImageData[] = [];
    
    images.forEach(image => {
      if (!uniqueIds.has(image.id)) {
        uniqueIds.add(image.id);
        uniqueImages.push(image);
      }
    });
    
    if (uniqueImages.length < images.length) {
      setImages(uniqueImages);
      return images.length - uniqueImages.length;
    }
    
    return 0;
  }, [images, setImages]);
  
  return { removeDuplicates };
};


import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { useHiddenImagesStorage } from './imageState/useLocalStorage';

export const useImageState = () => {
  // استخدام حالة React لتخزين الصور
  const [images, setImages] = useState<ImageData[]>([]);
  
  // استخدام هوك تخزين الصور المخفية من localStorage
  const { hiddenImageIds, hideImage, unhideImage, unhideAllImages, getHiddenImageIds } = useHiddenImagesStorage();
  
  // إضافة صورة جديدة إلى قائمة الصور
  const addImage = useCallback((newImage: ImageData) => {
    setImages(prevImages => [...prevImages, newImage]);
  }, []);
  
  // تحديث بيانات صورة موجودة
  const updateImage = useCallback((id: string, data: Partial<ImageData>) => {
    setImages(prevImages => 
      prevImages.map(image => 
        image.id === id ? { ...image, ...data } : image
      )
    );
  }, []);
  
  // حذف صورة من القائمة
  const deleteImage = useCallback((id: string, permanent: boolean = false) => {
    setImages(prevImages => prevImages.filter(image => image.id !== id));
    return true;
  }, []);
  
  // مسح جميع الصور من الجلسة الحالية
  const clearSessionImages = useCallback(() => {
    setImages(prevImages => prevImages.filter(image => !image.sessionImage));
  }, []);
  
  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);
  
  // تحديث نص مستخرج لصورة
  const handleTextChange = useCallback((id: string, text: string) => {
    updateImage(id, { extractedText: text });
  }, [updateImage]);
  
  // تعيين جميع الصور
  const setAllImages = useCallback((newImages: ImageData[]) => {
    setImages(newImages);
  }, []);

  return {
    images,
    addImage,
    updateImage,
    deleteImage,
    clearSessionImages,
    clearImages,
    handleTextChange,
    setAllImages,
    // تصدير وظائف إدارة الصور المخفية
    hiddenImageIds,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds
  };
};

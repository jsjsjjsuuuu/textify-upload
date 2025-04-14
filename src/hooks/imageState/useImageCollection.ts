
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

/**
 * هوك للتعامل مع مجموعة الصور
 * @param hiddenImageIds قائمة معرفات الصور المخفية
 */
export const useImageCollection = (hiddenImageIds: string[]) => {
  // حالة الصور العامة والصور المؤقتة
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  
  // إضافة صورة جديدة إلى المجموعة
  const addImage = useCallback((newImage: ImageData) => {
    // التحقق مما إذا كانت الصورة متوفرة بالفعل في المجموعة
    const imageExists = (img: ImageData) => img.id === newImage.id;
    
    setImages(prev => {
      // إذا كانت الصورة موجودة بالفعل، قم بتحديثها
      if (prev.some(imageExists)) {
        return prev.map(img => (img.id === newImage.id ? { ...img, ...newImage } : img));
      }
      // تجاهل الصور المخفية
      if (hiddenImageIds.includes(newImage.id)) {
        return prev;
      }
      // إضافة الصورة الجديدة في بداية المصفوفة
      return [newImage, ...prev];
    });
    
    // إذا كانت صورة مؤقتة، أضفها إلى قائمة الصور المؤقتة
    if (newImage.sessionImage) {
      setSessionImages(prev => {
        if (prev.some(imageExists)) {
          return prev.map(img => (img.id === newImage.id ? { ...img, ...newImage } : img));
        }
        return [newImage, ...prev];
      });
    }
  }, [hiddenImageIds]);
  
  // تحديث صورة موجودة
  const updateImage = useCallback((id: string, fields: Partial<ImageData>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...fields } : img
    ));
    
    // تحديث الصورة في قائمة الصور المؤقتة إذا كانت موجودة
    setSessionImages(prev => prev.map(img =>
      img.id === id ? { ...img, ...fields } : img
    ));
  }, []);
  
  // حذف صورة من المجموعة
  const deleteImage = useCallback((id: string, permanent: boolean = false) => {
    // إذا كان الحذف دائمًا، قم بإزالة الصورة تمامًا
    if (permanent) {
      setImages(prev => prev.filter(img => img.id !== id));
      setSessionImages(prev => prev.filter(img => img.id !== id));
    } 
    // وإلا، قم بإزالة الصورة فقط إذا كانت ليست مخفية بالفعل
    else if (!hiddenImageIds.includes(id)) {
      setImages(prev => prev.filter(img => img.id !== id));
      // لا نحذف الصورة من الصور المؤقتة لأنها قد تكون مخفية فقط
    }
    
    return true;
  }, [hiddenImageIds]);
  
  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
    setSessionImages([]);
  }, []);
  
  // مسح الصور المؤقتة فقط
  const clearSessionImages = useCallback(() => {
    setSessionImages([]);
    setImages(prev => prev.filter(img => !img.sessionImage));
  }, []);
  
  // تعيين جميع الصور
  const setAllImages = useCallback((newImages: ImageData[]) => {
    // تصفية الصور المخفية قبل التعيين
    const filteredImages = newImages.filter(img => !hiddenImageIds.includes(img.id));
    setImages(filteredImages);
  }, [hiddenImageIds]);
  
  // إضافة صور من قاعدة البيانات
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    // تصفية الصور المخفية قبل الإضافة
    const filteredImages = dbImages.filter(img => !hiddenImageIds.includes(img.id));
    
    // تجنب إضافة صور مكررة
    setImages(prev => {
      const existingIds = new Set(prev.map(img => img.id));
      const newImages = filteredImages.filter(img => !existingIds.has(img.id));
      return [...prev, ...newImages];
    });
  }, [hiddenImageIds]);
  
  // تعديل نص الصورة
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value });
  }, [updateImage]);
  
  return {
    images,
    sessionImages,
    addImage,
    updateImage,
    deleteImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    handleTextChange
  };
};

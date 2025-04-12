
import { useCallback, useState } from "react";
import { ImageData } from "@/types/ImageData";

export const useImageCollection = (hiddenImageIds: string[]) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    // تجاهل إضافة الصور المخفية
    if (hiddenImageIds.includes(newImage.id)) {
      console.log(`تجاهل إضافة صورة مخفية: ${newImage.id}`);
      return;
    }
    
    setImages(prev => [...prev, { ...newImage }]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, { ...newImage }]);
    }
  }, [hiddenImageIds]);

  // تحديث بيانات صورة بناءً على المعرف
  const updateImage = useCallback((id: string, updatedFields: Partial<ImageData>) => {
    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...updatedFields } : img
      )
    );
  }, []);

  // تحديث بيانات النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as any);
  }, [updateImage]);

  // حذف صورة من العرض فقط
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    // حذف الصورة من العرض المحلي
    setImages(prev => prev.filter(img => img.id !== id));
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    return true;
  }, []);

  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
    setSessionImages([]);
  }, []);

  // مسح الصور المؤقتة فقط
  const clearSessionImages = useCallback(() => {
    setImages(prev => prev.filter(img => !img.sessionImage));
    setSessionImages([]);
  }, []);

  // تعيين قائمة الصور مباشرة
  const setAllImages = useCallback((newImages: ImageData[]) => {
    // تصفية الصور المخفية من القائمة الجديدة
    const filteredImages = newImages.filter(img => !hiddenImageIds.includes(img.id));
    setImages(filteredImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = filteredImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, [hiddenImageIds]);

  // إضافة صور من قاعدة البيانات (الصور الدائمة)
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل والصور المخفية
      const newImages = dbImages.filter(dbImg => 
        !prev.some(existingImg => existingImg.id === dbImg.id) && 
        !hiddenImageIds.includes(dbImg.id)
      );
      return [...prev, ...newImages];
    });
  }, [hiddenImageIds]);

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

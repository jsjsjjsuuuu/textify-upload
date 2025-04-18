
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";

export const useImageCollection = (hiddenImageIds: string[] = []) => {
  const [images, setImages] = useState<ImageData[]>([]);
  
  // تعريف الصور الخاصة بالجلسة (الصور التي تم تحميلها في الجلسة الحالية)
  const sessionImages = images.filter(img => img.sessionImage === true);

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    setImages(prev => [...prev, newImage]);
  }, []);

  // تحديث صورة موجودة
  const updateImage = useCallback((id: string, data: Partial<ImageData>) => {
    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...data } : img
      )
    );
  }, []);

  // حذف صورة
  const deleteImage = useCallback((id: string, permanent = false) => {
    setImages(prev => prev.filter(img => img.id !== id));
    return true;
  }, []);

  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  // مسح فقط الصور المرتبطة بالجلسة الحالية
  const clearSessionImages = useCallback(() => {
    setImages(prev => prev.filter(img => !img.sessionImage));
  }, []);

  // تعيين جميع الصور
  const setAllImages = useCallback((newImages: ImageData[]) => {
    setImages(newImages);
  }, []);

  // إضافة صور من قاعدة البيانات
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    // استبعاد الصور المخفية والمكررة
    const filteredImages = dbImages.filter(
      dbImg => 
        !hiddenImageIds.includes(dbImg.id) && 
        !images.some(img => img.id === dbImg.id)
    );
    setImages(prev => [...prev, ...filteredImages]);
  }, [images, hiddenImageIds]);

  // تعديل نص في الصور
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value });
  }, [updateImage]);

  // إزالة الصور المكررة
  const removeDuplicates = useCallback(() => {
    const uniqueImagesMap = new Map<string, ImageData>();
    images.forEach(img => {
      if (!uniqueImagesMap.has(img.id)) {
        uniqueImagesMap.set(img.id, img);
      }
    });
    setImages(Array.from(uniqueImagesMap.values()));
  }, [images]);

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
    handleTextChange,
    removeDuplicates
  };
};

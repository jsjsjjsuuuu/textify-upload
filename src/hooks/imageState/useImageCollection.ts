
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { findDuplicateImages } from "@/utils/duplicateDetection/uniqueImageFinder";

export const useImageCollection = (hiddenImageIds: string[] = []) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  
  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    setImages(prevImages => {
      // تجاهل الصور المخفية
      if (hiddenImageIds.includes(newImage.id)) {
        return prevImages;
      }
      
      // تأكد من عدم وجود تكرار للصورة
      const exists = prevImages.some(img => img.id === newImage.id);
      if (exists) {
        return prevImages;
      }
      
      // إضافة الصورة الجديدة
      return [...prevImages, newImage];
    });
    
    // إذا كانت صورة جلسة، قم بإضافتها للجلسة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => {
        const exists = prev.some(img => img.id === newImage.id);
        if (exists) return prev;
        return [...prev, newImage];
      });
    }
    
    return true;
  }, [hiddenImageIds]);
  
  // تحديث بيانات صورة موجودة
  const updateImage = useCallback((id: string, data: Partial<ImageData>) => {
    setImages(prevImages => {
      return prevImages.map(img => {
        if (img.id === id) {
          return { ...img, ...data };
        }
        return img;
      });
    });
    
    // تحديث صورة الجلسة إذا كانت موجودة
    setSessionImages(prevImages => {
      return prevImages.map(img => {
        if (img.id === id) {
          return { ...img, ...data };
        }
        return img;
      });
    });
  }, []);
  
  // حذف صورة
  const deleteImage = useCallback((id: string, permanent: boolean = false) => {
    // حذف من قائمة الصور
    setImages(prevImages => prevImages.filter(img => img.id !== id));
    
    // حذف من صور الجلسة
    setSessionImages(prevImages => prevImages.filter(img => img.id !== id));
    
    return true;
  }, []);
  
  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);
  
  // مسح صور الجلسة فقط
  const clearSessionImages = useCallback(() => {
    setSessionImages([]);
    setImages(prevImages => prevImages.filter(img => !img.sessionImage));
  }, []);
  
  // تعيين جميع الصور
  const setAllImages = useCallback((newImages: ImageData[]) => {
    // تصفية الصور المخفية
    const visibleImages = newImages.filter(img => !hiddenImageIds.includes(img.id));
    setImages(visibleImages);
  }, [hiddenImageIds]);
  
  // إضافة صور من قاعدة البيانات
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    // تصفية الصور المخفية
    const visibleImages = dbImages.filter(img => !hiddenImageIds.includes(img.id));
    
    setImages(prevImages => {
      // دمج الصور الحالية مع الصور من قاعدة البيانات
      const allImages = [...prevImages];
      
      visibleImages.forEach(dbImg => {
        // التحقق من عدم وجود الصورة بالفعل
        const existingIndex = allImages.findIndex(img => img.id === dbImg.id);
        if (existingIndex === -1) {
          allImages.push(dbImg);
        } else {
          // تحديث الصورة الموجودة إذا كانت الصورة من قاعدة البيانات أحدث
          if (dbImg.updated_at && (!allImages[existingIndex].updated_at || dbImg.updated_at > allImages[existingIndex].updated_at)) {
            allImages[existingIndex] = { ...allImages[existingIndex], ...dbImg };
          }
        }
      });
      
      return allImages;
    });
    
    return true;
  }, [hiddenImageIds]);
  
  // معالجة تغيير النص في حقول الصورة
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as Partial<ImageData>);
  }, [updateImage]);
  
  // إزالة الصور المكررة
  const removeDuplicates = useCallback(() => {
    // استخدام وظيفة البحث عن الصور المكررة
    const uniqueImages = findDuplicateImages(images);
    setImages(uniqueImages);
    
    // أيضًا إزالة التكرارات من صور الجلسة
    const uniqueSessionImages = findDuplicateImages(sessionImages);
    setSessionImages(uniqueSessionImages);
    
    return true;
  }, [images, sessionImages]);
  
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

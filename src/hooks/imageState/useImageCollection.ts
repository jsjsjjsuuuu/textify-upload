
import { useCallback, useState } from "react";
import { ImageData } from "@/types/ImageData";

export const useImageCollection = (hiddenImageIds: string[]) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);

  // إنشاء عنوان URL آمن لمعاينة الصورة
  const createSafeObjectURL = useCallback((file: File): string => {
    try {
      // إنشاء رابط URL للملف في نفس سياق الموقع
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("خطأ في إنشاء عنوان URL للصورة:", error);
      // في حالة الفشل، إنشاء رابط بديل باستخدام Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }) as unknown as string;
    }
  }, []);

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    // تجاهل إضافة الصور المخفية
    if (hiddenImageIds.includes(newImage.id)) {
      console.log(`تجاهل إضافة صورة مخفية: ${newImage.id}`);
      return;
    }
    
    // التأكد من أن لدينا عنوان معاينة آمن للصورة
    const imageWithSafeUrl = { ...newImage };
    if (newImage.file && (!newImage.previewUrl || newImage.previewUrl.startsWith('blob:'))) {
      imageWithSafeUrl.previewUrl = createSafeObjectURL(newImage.file);
    }
    
    setImages(prev => [...prev, imageWithSafeUrl]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, imageWithSafeUrl]);
    }
  }, [hiddenImageIds, createSafeObjectURL]);

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
    
    // معالجة الصور للتأكد من أن لديها روابط معاينة آمنة
    const safeImages = filteredImages.map(img => {
      // إذا كان لدينا ملف ولكن الرابط غير آمن، نقوم بإنشاء رابط آمن
      if (img.file && (!img.previewUrl || img.previewUrl.startsWith('blob:'))) {
        return { ...img, previewUrl: createSafeObjectURL(img.file) };
      }
      return img;
    });
    
    setImages(safeImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = safeImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, [hiddenImageIds, createSafeObjectURL]);

  // إضافة صور من قاعدة البيانات (الصور الدائمة)
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل والصور المخفية
      const newImages = dbImages.filter(dbImg => 
        !prev.some(existingImg => existingImg.id === dbImg.id) && 
        !hiddenImageIds.includes(dbImg.id)
      );
      
      // معالجة الصور للتأكد من أن لديها روابط معاينة آمنة
      const safeImages = newImages.map(img => {
        if (img.file && (!img.previewUrl || img.previewUrl.startsWith('blob:'))) {
          return { ...img, previewUrl: createSafeObjectURL(img.file) };
        }
        return img;
      });
      
      return [...prev, ...safeImages];
    });
  }, [hiddenImageIds, createSafeObjectURL]);

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
    createSafeObjectURL
  };
};

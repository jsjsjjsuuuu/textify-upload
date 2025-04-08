
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "./use-toast";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    setImages(prev => [...prev, { ...newImage }]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, { ...newImage }]);
    }
  }, []);

  // تحديث بيانات صورة بناءً على المعرف
  const updateImage = useCallback((id: string, updatedFields: Partial<ImageData>) => {
    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...updatedFields } : img
      )
    );
  }, []);

  // حذف صورة
  const deleteImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSessionImages(prev => prev.filter(img => img.id !== id));
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
    
    toast({
      title: "تم مسح الصور المؤقتة",
      description: "تم مسح جميع الصور المؤقتة من هذه الجلسة",
    });
  }, [toast]);

  // تعيين قائمة الصور مباشرة
  const setAllImages = useCallback((newImages: ImageData[]) => {
    setImages(newImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = newImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, []);

  // إضافة صور من قاعدة البيانات (الصور الدائمة)
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل
      const newImages = dbImages.filter(dbImg => 
        !prev.some(existingImg => existingImg.id === dbImg.id)
      );
      return [...prev, ...newImages];
    });
  }, []);

  // إزالة التكرارات من قائمة الصور
  const removeDuplicates = useCallback(() => {
    const uniqueImagesMap = new Map<string, ImageData>();
    
    // ابتداء بالصور ذات الحالة "completed" للتأكد من الاحتفاظ بالصور المكتملة
    const sortedImages = [...images].sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return -1;
      if (a.status !== "completed" && b.status === "completed") return 1;
      return 0;
    });
    
    // استخدام معرّف الصورة كمفتاح للتخزين المؤقت
    sortedImages.forEach(img => {
      if (!uniqueImagesMap.has(img.id)) {
        uniqueImagesMap.set(img.id, img);
      }
    });
    
    const uniqueImages = Array.from(uniqueImagesMap.values());
    
    if (uniqueImages.length < images.length) {
      console.log(`تم إزالة ${images.length - uniqueImages.length} صورة مكررة`);
      setImages(uniqueImages);
      
      // تحديث الصور المؤقتة أيضًا
      const sessionOnly = uniqueImages.filter(img => img.sessionImage);
      setSessionImages(sessionOnly);
    }
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
    removeDuplicates
  };
};

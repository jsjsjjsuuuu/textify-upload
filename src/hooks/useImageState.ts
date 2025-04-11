
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "./use-toast";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const [hiddenImages, setHiddenImages] = useState<string[]>([]);
  const { toast } = useToast();

  // استيراد قائمة الصور المخفية من localStorage عند بدء التطبيق
  useEffect(() => {
    const storedHiddenImages = localStorage.getItem('hiddenImages');
    if (storedHiddenImages) {
      try {
        const parsedHiddenImages = JSON.parse(storedHiddenImages);
        if (Array.isArray(parsedHiddenImages)) {
          setHiddenImages(parsedHiddenImages);
        }
      } catch (error) {
        console.error('خطأ في قراءة الصور المخفية من التخزين المحلي:', error);
      }
    }
  }, []);

  // تحديث التخزين المحلي عند تغيير قائمة الصور المخفية
  useEffect(() => {
    if (hiddenImages.length > 0) {
      localStorage.setItem('hiddenImages', JSON.stringify(hiddenImages));
    }
  }, [hiddenImages]);

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    // تحقق مما إذا كانت الصورة موجودة في قائمة الإخفاء
    if (hiddenImages.includes(newImage.id)) {
      console.log('تم تجاهل إضافة صورة مخفية:', newImage.id);
      return;
    }
    
    setImages(prev => [...prev, { ...newImage }]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, { ...newImage }]);
    }
  }, [hiddenImages]);

  // تحديث بيانات صورة بناءً على المعرف
  const updateImage = useCallback((id: string, updatedFields: Partial<ImageData>) => {
    // تجاهل تحديث الصور المخفية
    if (hiddenImages.includes(id)) {
      return;
    }

    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...updatedFields } : img
      )
    );
  }, [hiddenImages]);

  // تحديث بيانات النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as any);
  }, [updateImage]);

  // حذف صورة من العرض فقط (دون حذفها من قاعدة البيانات)
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    // إضافة معرف الصورة إلى قائمة الصور المخفية
    setHiddenImages(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
    
    // حذف الصورة من العرض المحلي فقط
    setImages(prev => prev.filter(img => img.id !== id));
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    if (!removeFromDatabase) {
      toast({
        title: "تمت الإزالة من العرض",
        description: "تم إزالة الصورة من العرض الحالي، لكنها لا تزال مخزنة في السجلات",
      });
    }
    
    return true;
  }, [toast]);

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
    // تصفية الصور المخفية من القائمة الجديدة
    const filteredImages = newImages.filter(img => !hiddenImages.includes(img.id));
    setImages(filteredImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = filteredImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, [hiddenImages]);

  // إضافة صور من قاعدة البيانات (الصور الدائمة)
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل والصور المخفية
      const newImages = dbImages.filter(dbImg => 
        !prev.some(existingImg => existingImg.id === dbImg.id) && 
        !hiddenImages.includes(dbImg.id)
      );
      return [...prev, ...newImages];
    });
  }, [hiddenImages]);

  // وظيفة لإعادة إظهار صورة كانت مخفية
  const unhideImage = useCallback((id: string) => {
    setHiddenImages(prev => prev.filter(imageId => imageId !== id));
    return true;
  }, []);

  // وظيفة لإعادة إظهار جميع الصور المخفية
  const unhideAllImages = useCallback(() => {
    setHiddenImages([]);
    localStorage.removeItem('hiddenImages');
    return true;
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
    hiddenImages,
    addImage,
    updateImage,
    deleteImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    removeDuplicates,
    handleTextChange,
    unhideImage,
    unhideAllImages
  };
};


import { useState, useCallback, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "./use-toast";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const [hiddenImageIds, setHiddenImageIds] = useState<string[]>([]);
  const { toast } = useToast();

  // استدعاء الصور المخفية من التخزين المحلي عند بدء التطبيق
  useEffect(() => {
    try {
      const storedHiddenImages = localStorage.getItem('hiddenImageIds');
      if (storedHiddenImages) {
        setHiddenImageIds(JSON.parse(storedHiddenImages));
      }
    } catch (error) {
      console.error("خطأ في استرجاع الصور المخفية:", error);
    }
  }, []);

  // حفظ الصور المخفية في التخزين المحلي عند تغييرها
  useEffect(() => {
    try {
      localStorage.setItem('hiddenImageIds', JSON.stringify(hiddenImageIds));
    } catch (error) {
      console.error("خطأ في حفظ الصور المخفية:", error);
    }
  }, [hiddenImageIds]);

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

  // تحديث بيانات النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as any);
  }, [updateImage]);

  // حذف صورة من العرض فقط (دون حذفها من قاعدة البيانات)
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    if (!removeFromDatabase) {
      // إضافة الصورة إلى قائمة الصور المخفية
      setHiddenImageIds(prev => [...prev, id]);
      
      toast({
        title: "تمت الإزالة من العرض",
        description: "تم إخفاء الصورة من العرض الحالي، لكنها لا تزال مخزنة في السجلات",
      });
    } else {
      // حذفها من قائمة الصور المخفية أيضًا إذا تم حذفها من قاعدة البيانات
      setHiddenImageIds(prev => prev.filter(hiddenId => hiddenId !== id));
    }
    
    // حذف الصورة من العرض المحلي
    setImages(prev => prev.filter(img => img.id !== id));
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    return true;
  }, [toast]);

  // إعادة إظهار صورة تم إخفاؤها سابقًا
  const unhideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => prev.filter(hiddenId => hiddenId !== id));
    
    toast({
      title: "تمت إعادة الإظهار",
      description: "تم إعادة إظهار الصورة في العرض",
    });
    
    return true;
  }, [toast]);

  // إعادة إظهار جميع الصور المخفية
  const unhideAllImages = useCallback(() => {
    setHiddenImageIds([]);
    
    toast({
      title: "تمت إعادة إظهار جميع الصور",
      description: "تم إعادة إظهار جميع الصور المخفية",
    });
    
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

  // الحصول على قائمة معرفات الصور المخفية
  const getHiddenImageIds = useCallback(() => {
    return hiddenImageIds;
  }, [hiddenImageIds]);

  return {
    images,
    sessionImages,
    hiddenImageIds,
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
    unhideAllImages,
    getHiddenImageIds
  };
};

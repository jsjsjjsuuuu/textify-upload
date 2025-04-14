
import { useCallback, useState, useRef, useEffect } from "react";
import { ImageData } from "@/types/ImageData";

export const useImageCollection = (hiddenImageIds: string[]) => {
  // استخدام مراجع للتحسين من الأداء وتقليل عمليات إعادة الرسم
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const hiddenIdsSetRef = useRef<Set<string>>(new Set(hiddenImageIds));
  
  // تحديث مجموعة المعرفات المخفية عند تغييرها
  useEffect(() => {
    hiddenIdsSetRef.current = new Set(hiddenImageIds);
  }, [hiddenImageIds]);

  // إنشاء عنوان URL آمن للصورة، مع تفضيل URL.createObjectURL لتحسين الأداء
  const createSafeObjectURL = useCallback((file: File): string => {
    if (!file) {
      console.error("محاولة إنشاء عنوان URL بدون ملف صالح!");
      return "";
    }
    
    try {
      // استخدام URL.createObjectURL لسرعته وكفاءته 
      return URL.createObjectURL(file);
    } catch (error) {
      console.warn("فشل في إنشاء URL.createObjectURL، استخدام FileReader كبديل:", error);
      
      // استخدام FileReader كبديل إذا فشل URL.createObjectURL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }) as unknown as string;
    }
  }, []);

  // تنظيف عناوين URL عند إزالة المكون
  useEffect(() => {
    return () => {
      // تحرير موارد Blob URLs عند تفكيك المكون
      images.forEach(img => {
        if (img.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  // إضافة صورة جديدة بكفاءة أكبر
  const addImage = useCallback((newImage: ImageData) => {
    // تجاهل إضافة الصور المخفية
    if (hiddenIdsSetRef.current.has(newImage.id)) {
      console.log(`تجاهل إضافة صورة مخفية: ${newImage.id}`);
      return;
    }
    
    // التأكد من أن لدينا عنوان معاينة آمن للصورة
    const imageWithSafeUrl = { ...newImage };
    
    if (newImage.file && (!newImage.previewUrl || newImage.previewUrl.startsWith('blob:'))) {
      // إنشاء Blob URL مباشرة بدلاً من الانتظار (تحسين)
      if (newImage.previewUrl?.startsWith('blob:')) {
        // استخدام العنوان الموجود إن كان موجوداً
        imageWithSafeUrl.previewUrl = newImage.previewUrl;
      } else {
        try {
          // إنشاء عنوان URL للمعاينة
          imageWithSafeUrl.previewUrl = URL.createObjectURL(newImage.file);
        } catch (error) {
          console.error("خطأ في إنشاء URL للمعاينة:", error);
          imageWithSafeUrl.previewUrl = "loading";
        }
      }
    }
    
    // استخدام دالة التحديث الوظيفية للحالة لتفادي مشاكل التزامن
    setImages(prev => [...prev, imageWithSafeUrl]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, imageWithSafeUrl]);
    }
  }, []);

  // تحديث بيانات صورة بناءً على المعرف - تحسين الأداء
  const updateImage = useCallback((id: string, updatedFields: Partial<ImageData>) => {
    setImages(prev => {
      const imageIndex = prev.findIndex(img => img.id === id);
      if (imageIndex === -1) return prev;
      
      // تنفيذ التحديث بكفاءة
      const newImages = [...prev];
      newImages[imageIndex] = { ...newImages[imageIndex], ...updatedFields };
      return newImages;
    });
  }, []);

  // تحديث بيانات النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as any);
  }, [updateImage]);

  // حذف صورة من العرض - تحسين مع تنظيف الموارد
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    setImages(prev => {
      // تحرير أي موارد URL.createObjectURL قبل الحذف
      const imageToDelete = prev.find(img => img.id === id);
      if (imageToDelete?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.previewUrl);
      }
      
      return prev.filter(img => img.id !== id);
    });
    
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    return true;
  }, []);

  // مسح جميع الصور مع تنظيف الموارد
  const clearImages = useCallback(() => {
    // تحرير موارد URL.createObjectURL
    images.forEach(img => {
      if (img.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    
    setImages([]);
    setSessionImages([]);
  }, [images]);

  // مسح الصور المؤقتة فقط
  const clearSessionImages = useCallback(() => {
    // تحرير موارد URL.createObjectURL للصور المؤقتة
    sessionImages.forEach(img => {
      if (img.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    
    setImages(prev => prev.filter(img => !img.sessionImage));
    setSessionImages([]);
  }, [sessionImages]);

  // تعيين قائمة الصور مباشرة بكفاءة
  const setAllImages = useCallback((newImages: ImageData[]) => {
    // تحرير الموارد الحالية
    images.forEach(img => {
      if (img.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    
    // تصفية الصور المخفية بكفاءة
    const filteredImages = newImages.filter(img => !hiddenIdsSetRef.current.has(img.id));
    
    // معالجة الصور للتأكد من أن لديها روابط معاينة آمنة
    const processedImages = filteredImages.map(img => {
      if (!img.previewUrl && img.file) {
        try {
          // إنشاء عنوان URL للمعاينة
          return { ...img, previewUrl: URL.createObjectURL(img.file) };
        } catch (error) {
          console.error("خطأ في إنشاء URL للمعاينة:", error);
          return img;
        }
      }
      return img;
    });
    
    setImages(processedImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = processedImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, [images]);

  // إضافة صور من قاعدة البيانات
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    if (!dbImages.length) return;
    
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل والصور المخفية بكفاءة
      const prevIds = new Set(prev.map(img => img.id));
      
      const newImages = dbImages.filter(dbImg => 
        !prevIds.has(dbImg.id) && !hiddenIdsSetRef.current.has(dbImg.id)
      ).map(img => {
        if (!img.previewUrl && img.file) {
          try {
            // إنشاء عنوان URL للمعاينة
            return { ...img, previewUrl: URL.createObjectURL(img.file) };
          } catch (error) {
            console.error("خطأ في إنشاء URL للمعاينة:", error);
            return img;
          }
        }
        return img;
      });
      
      return [...prev, ...newImages];
    });
  }, []);

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

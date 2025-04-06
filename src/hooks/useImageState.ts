import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useImageState = () => {
  // حالتان منفصلتان للصور: الصور المؤقتة والصور المستخرجة من قاعدة البيانات
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  const addImage = (newImage: ImageData) => {
    // تحسين منطق البحث عن التكرار - تحقق أكثر دقة
    const isDuplicateSession = sessionImages.some(img => 
      img.id === newImage.id || 
      (img.file.name === newImage.file.name && img.user_id === newImage.user_id)
    );
    
    const isDuplicateAll = images.some(img => 
      img.id === newImage.id || 
      (img.file.name === newImage.file.name && img.user_id === newImage.user_id && img.batch_id === newImage.batch_id)
    );
    
    if (isDuplicateSession || isDuplicateAll) {
      console.log("تم تجاهل الصورة المكررة:", newImage.file.name);
      
      // إذا كان لدينا نفس المعرف ولكن بحالة مختلفة، نقوم بتحديث الصورة الحالية فقط
      if (newImage.id) {
        const existingSessionImage = sessionImages.find(img => img.id === newImage.id);
        const existingImage = images.find(img => img.id === newImage.id);
        
        if ((existingSessionImage && existingSessionImage.status !== newImage.status) ||
            (existingImage && existingImage.status !== newImage.status)) {
          console.log("تحديث حالة الصورة الموجودة:", newImage.id);
          updateImage(newImage.id, { status: newImage.status });
        }
      }
      return;
    }
    
    // إضافة طابع زمني لمساعدة في التمييز بين الصور وإزالة التكرارات
    const imageWithDefaults: ImageData = {
      status: "pending", // قيمة افتراضية
      ...newImage,
      added_at: new Date().getTime() // إضافة الطابع الزمني
    };
    
    console.log("إضافة صورة جديدة:", imageWithDefaults.id);
    
    // إضافة الصورة إلى مجموعة الصور المؤقتة للجلسة الحالية
    setSessionImages(prev => [imageWithDefaults, ...prev]);
    
    // إضافة الصورة إلى مجموعة جميع الصور
    setImages(prev => [imageWithDefaults, ...prev]);
  };

  const updateImage = (id: string, updatedFields: Partial<ImageData>) => {
    console.log("تحديث الصورة:", id, updatedFields);
    
    // تحديث الصورة في مجموعة الصور المؤقتة
    setSessionImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updatedFields } : img
    ));
    
    // تحديث الصورة في مجموعة جميع الصور
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updatedFields } : img
    ));
  };

  const deleteImage = (id: string) => {
    console.log("حذف الصورة:", id);
    
    // حذف الصورة من مجموعة الصور المؤقتة
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    // حذف الصورة من مجموعة جميع الصور
    setImages(prev => prev.filter(img => img.id !== id));
    
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح"
    });
  };

  const handleTextChange = (id: string, field: string, value: string) => {
    console.log(`تحديث حقل ${field} للصورة ${id} بالقيمة: "${value}"`);
    
    // إذا كان الحقل من الحقول الأساسية وأصبح لدينا جميع الحقول المطلوبة، نحدث الحالة إلى "مكتمل"
    const image = images.find(img => img.id === id);
    if (image) {
      const updatedImage = { ...image, [field]: value };
      
      // التحقق مما إذا كانت جميع الحقول الأساسية مكتملة
      if (updatedImage.code && updatedImage.senderName && updatedImage.phoneNumber) {
        updateImage(id, { [field]: value, status: "completed" });
      } else {
        updateImage(id, { [field]: value });
      }
    } else {
      console.warn("لم يتم العثور على الصورة بالمعرف:", id);
    }
  };

  // الحصول على الصور مرتبة
  const getSortedImages = () => {
    return [...images].sort((a, b) => {
      const aNum = a.number || 0;
      const bNum = b.number || 0;
      return bNum - aNum;
    });
  };
  
  // الحصول على الصور المؤقتة من الجلسة الحالية مرتبة
  const getSortedSessionImages = () => {
    return [...sessionImages].sort((a, b) => {
      const aNum = a.number || 0;
      const bNum = b.number || 0;
      return bNum - aNum;
    });
  };

  // تحديث قائمة الصور كاملة من قاعدة البيانات
  const setAllImages = (newImages: ImageData[]) => {
    // الاحتفاظ بالصور المخزنة مسبقاً فقط وليس الصور المؤقتة
    setImages(newImages);
  };
  
  // إضافة الصور الثابتة من قاعدة البيانات إلى مصفوفة الصور
  const addDatabaseImages = (dbImages: ImageData[]) => {
    // نقوم بإضافة الصور من قاعدة البيانات ولكن نتأكد من عدم تكرارها
    setImages(prev => {
      // حذف الصور الموجودة بالفعل بنفس المعرف من القائمة السابقة
      const filteredImages = prev.filter(img => 
        !dbImages.some(dbImg => dbImg.id === img.id)
      );
      
      // إضافة الصور الجديدة من قاعدة البيانات
      return [...filteredImages, ...dbImages];
    });
  };
  
  // مسح الصور المؤقتة
  const clearSessionImages = () => {
    setSessionImages([]);
  };

  // تحسين دالة إزالة التكرارات
  const removeDuplicates = () => {
    const uniqueImagesMap = new Map<string, ImageData>();
    
    // استخدام مفتاح أكثر دقة للتخزين المؤقت للصور الفريدة
    images.forEach(img => {
      // إنشاء مفتاح فريد يتضمن اسم الملف ومعرّف المستخدم والمجموعة
      const key = `${img.file.name}_${img.user_id || ''}_${img.batch_id || ''}`;
      
      // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
      if (!uniqueImagesMap.has(key) || 
          (img.added_at && uniqueImagesMap.get(key)?.added_at && img.added_at > uniqueImagesMap.get(key)!.added_at!)) {
        uniqueImagesMap.set(key, img);
      }
    });
    
    // تحويل الخريطة إلى مصفوفة
    const deduplicatedImages = Array.from(uniqueImagesMap.values());
    
    if (deduplicatedImages.length < images.length) {
      const removedCount = images.length - deduplicatedImages.length;
      toast({
        title: "تمت إزالة التكرارات",
        description: `تم حذف ${removedCount} صورة مكررة`
      });
      
      setImages(deduplicatedImages);
      
      // تحديث الصور المؤقتة أيضاً
      setSessionImages(prev => prev.filter(img => 
        deduplicatedImages.some(unique => unique.id === img.id)
      ));
      
      console.log(`تم إزالة ${removedCount} صورة مكررة. الصور المتبقية: ${deduplicatedImages.length}`);
    } else {
      console.log("لا توجد صور مكررة للإزالة");
    }
  };

  // تنظيف عناوين URL للكائنات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      console.log("تنظيف عناوين URL للكائنات");
      images.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images: getSortedImages(),
    sessionImages: getSortedSessionImages(),
    addImage,
    updateImage,
    deleteImage,
    handleTextChange,
    setAllImages,
    addDatabaseImages,
    clearSessionImages,
    removeDuplicates
  };
};

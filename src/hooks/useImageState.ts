import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { removeDuplicatesFromImages, isDuplicateImage, generateProcessingId } from "@/utils/duplicateRemover";

export const useImageState = () => {
  // حالتان منفصلتان للصور: الصور المؤقتة والصور المستخرجة من قاعدة البيانات
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  // تحسين آلية إضافة صورة جديدة مع تحقق أفضل من التكرارات
  const addImage = (newImage: ImageData) => {
    // استخدام الوظيفة الجديدة للتحقق من التكرارات
    const isDuplicateInSession = isDuplicateImage(newImage, sessionImages);
    const isDuplicateInAll = isDuplicateImage(newImage, images);
    
    if (isDuplicateInSession || isDuplicateInAll) {
      console.log("تم تجاهل الصورة المكررة:", newImage.file.name);
      
      // إذا كان لدينا نفس المعرف ولكن بحالة مختلفة، نقوم بتحديث الصورة الحالية فقط
      if (newImage.id) {
        const existingSessionImage = sessionImages.find(img => img.id === newImage.id);
        const existingImage = images.find(img => img.id === newImage.id);
        
        // تحسين منطق التحديث بالمقارنة مع الطابع الزمني والحالة
        const shouldUpdate = (
          (existingSessionImage && 
           (existingSessionImage.status !== newImage.status || 
            (newImage.added_at && existingSessionImage.added_at && newImage.added_at > existingSessionImage.added_at))) ||
          (existingImage && 
           (existingImage.status !== newImage.status ||
            (newImage.added_at && existingImage.added_at && newImage.added_at > existingImage.added_at)))
        );
        
        if (shouldUpdate) {
          console.log("تحديث الصورة الموجودة:", newImage.id, "الحالة الجديدة:", newImage.status);
          updateImage(newImage.id, { 
            status: newImage.status,
            extractedText: newImage.extractedText || existingImage?.extractedText || existingSessionImage?.extractedText,
            added_at: newImage.added_at || Date.now(),
            code: newImage.code || existingImage?.code || existingSessionImage?.code,
            senderName: newImage.senderName || existingImage?.senderName || existingSessionImage?.senderName,
            phoneNumber: newImage.phoneNumber || existingImage?.phoneNumber || existingSessionImage?.phoneNumber,
            province: newImage.province || existingImage?.province || existingSessionImage?.province,
            price: newImage.price || existingImage?.price || existingSessionImage?.price,
            companyName: newImage.companyName || existingImage?.companyName || existingSessionImage?.companyName
          });
        }
      }
      return;
    }
    
    // إضافة طابع زمني ومعرف عملية لمساعدة في التمييز بين الصور وإزالة التكرارات
    const imageWithDefaults: ImageData = {
      status: "pending", // قيمة افتراضية
      ...newImage,
      added_at: newImage.added_at || Date.now(), // إضافة الطابع الزمني
      processingId: newImage.processingId || generateProcessingId() // إضافة معرف فريد للعملية
    };
    
    console.log("إضافة صورة جديدة:", imageWithDefaults.id, "مع معرف العملية:", imageWithDefaults.processingId);
    
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

  // تحسين دالة إزالة التكرارات لاستخدام الوظيفة الجديدة
  const removeDuplicates = () => {
    // استخدام وظيفة إزالة التكرارات الجديدة
    const { deduplicatedImages, removedCount } = removeDuplicatesFromImages(images, true);
    
    if (removedCount > 0) {
      // تحديث حالة الصور بعد إزالة التكرارات
      setImages(deduplicatedImages);
      
      // تنقية الصور المؤقتة من التكرارات أيضاً
      const { deduplicatedImages: deduplicatedSessionImages } = removeDuplicatesFromImages(sessionImages, false);
      setSessionImages(deduplicatedSessionImages);
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

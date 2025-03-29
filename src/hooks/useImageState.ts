
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useImageState = () => {
  // حالتان منفصلتان للصور: الصور المؤقتة والصور المستخرجة من قاعدة البيانات
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  // تحسين آلية إضافة صورة جديدة مع تحقق أفضل من التكرارات
  const addImage = (newImage: ImageData) => {
    // تحسين منطق البحث عن التكرار - تحقق أكثر دقة مع تجنب الانضمام المتعدد
    // إنشاء معرف فريد للصورة يتضمن المزيد من البيانات المميزة
    const generateUniqueImageKey = (img: ImageData) => {
      const fileNameComponent = img.file?.name || 'unknown';
      const userComponent = img.user_id || 'anonymous';
      const batchComponent = img.batch_id || 'default';
      // إضافة حجم الملف والنوع كمؤشرات إضافية لتحقيق تفرد أكبر
      const fileSizeComponent = img.file?.size?.toString() || '0';
      const fileTypeComponent = img.file?.type || 'unknown';
      
      return `${fileNameComponent}_${userComponent}_${batchComponent}_${fileSizeComponent}_${fileTypeComponent}`;
    };
    
    const newImageKey = generateUniqueImageKey(newImage);
    
    const isDuplicateSession = sessionImages.some(img => 
      img.id === newImage.id || generateUniqueImageKey(img) === newImageKey
    );
    
    const isDuplicateAll = images.some(img => 
      img.id === newImage.id || generateUniqueImageKey(img) === newImageKey
    );
    
    if (isDuplicateSession || isDuplicateAll) {
      console.log("تم تجاهل الصورة المكررة:", newImage.file.name, "مع المعرف:", newImageKey);
      
      // إذا كان لدينا نفس المعرف ولكن بحالة مختلفة، نقوم بتحديث الصورة الحالية فقط
      if (newImage.id) {
        const existingSessionImage = sessionImages.find(img => 
          img.id === newImage.id || generateUniqueImageKey(img) === newImageKey
        );
        const existingImage = images.find(img => 
          img.id === newImage.id || generateUniqueImageKey(img) === newImageKey
        );
        
        // تحسين منطق التحديث بالمقارنة مع الطابع الزمني
        // فقط تحديث الصورة إذا كانت الصورة الجديدة أحدث أو إذا تغيرت الحالة
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
            added_at: newImage.added_at
          });
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
    
    console.log("إضافة صورة جديدة:", imageWithDefaults.id, "مع المعرف:", newImageKey);
    
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
    // إنشاء وظيفة منفصلة لإنشاء مفاتيح فريدة متسقة مع الإضافة
    const generateUniqueImageKey = (img: ImageData) => {
      const fileNameComponent = img.file?.name || 'unknown';
      const userComponent = img.user_id || 'anonymous';
      const batchComponent = img.batch_id || 'default';
      const fileSizeComponent = img.file?.size?.toString() || '0';
      const fileTypeComponent = img.file?.type || 'unknown';
      
      return `${fileNameComponent}_${userComponent}_${batchComponent}_${fileSizeComponent}_${fileTypeComponent}`;
    };
    
    const uniqueImagesMap = new Map<string, ImageData>();
    
    // استخدام مفتاح أكثر دقة للتخزين المؤقت للصور الفريدة
    images.forEach(img => {
      // إنشاء مفتاح فريد باستخدام الوظيفة المشتركة
      const key = generateUniqueImageKey(img);
      
      // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
      // أو إذا كانت الصورة القديمة في حالة خطأ والجديدة لا
      const existingImage = uniqueImagesMap.get(key);
      
      const shouldReplace = !existingImage || 
        (img.added_at && existingImage.added_at && img.added_at > existingImage.added_at) ||
        (existingImage.status === 'error' && img.status !== 'error');
      
      if (shouldReplace) {
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
      
      // تحديث الصور المؤقتة أيضاً باستخدام نفس منطق التفرد
      const sessionUniqueMap = new Map<string, ImageData>();
      
      sessionImages.forEach(img => {
        const key = generateUniqueImageKey(img);
        const existingImage = sessionUniqueMap.get(key);

        // نحتفظ فقط بالصورة الأحدث أو التي ليست في حالة خطأ
        const shouldReplace = !existingImage || 
          (img.added_at && existingImage.added_at && img.added_at > existingImage.added_at) ||
          (existingImage.status === 'error' && img.status !== 'error');
        
        if (shouldReplace) {
          sessionUniqueMap.set(key, img);
        }
      });
      
      setSessionImages(Array.from(sessionUniqueMap.values()));
      
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

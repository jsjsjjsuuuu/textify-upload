
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";

export const useImageProcessingCore = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    images, 
    sessionImages,
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    setAllImages,
    addDatabaseImages,
    clearSessionImages,
    removeDuplicates
  } = useImageState();
  
  const {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats,
    isImageProcessed,
    markImageAsProcessed,
    clearProcessedImagesCache
  } = useImageStats();
  
  const { saveProcessedImage } = useSavedImageProcessing(updateImage, setAllImages);
  
  const { 
    isLoadingUserImages,
    loadUserImages,
    saveImageToDatabase,
    handleSubmitToApi: submitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  } = useImageDatabase(updateImage);
  
  // التحقق مما إذا كانت الصورة مكررة بناءً على خصائص متعددة
  const isDuplicateImage = useCallback((newImage: ImageData, allImages: ImageData[]): boolean => {
    // التحقق من التكرار باستخدام المعرف
    if (allImages.some(img => img.id === newImage.id)) {
      return true;
    }

    // التحقق من التكرار باستخدام اسم الملف والحجم (قد يكون نفس الملف)
    if (allImages.some(img => 
      img.file && newImage.file && 
      img.file.name === newImage.file.name && 
      img.file.size === newImage.file.size &&
      img.user_id === newImage.user_id
    )) {
      return true;
    }
    
    // التحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
    if (newImage.id && isImageProcessed(newImage.id)) {
      return true;
    }
    
    // إذا كان هناك هاش للصورة، استخدمه للمقارنة
    if (newImage.imageHash && allImages.some(img => img.imageHash === newImage.imageHash)) {
      return true;
    }

    return false;
  }, [isImageProcessed]);

  // التحقق من اكتمال البيانات المطلوبة للصورة
  const validateRequiredFields = (image: ImageData): boolean => {
    if (!image.code || !image.senderName || !image.phoneNumber || !image.province || !image.price) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر",
        variant: "destructive"
      });
      return false;
    }
    
    // التحقق من صحة رقم الهاتف (11 رقم)
    if (image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      toast({
        title: "رقم هاتف غير صحيح",
        description: "يجب أن يكون رقم الهاتف 11 رقم بالضبط",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // إعادة هيكلة وظيفة handleSubmitToApi لتستخدم وظيفة saveProcessedImage
  const handleSubmitToApi = async (id: string) => {
    // العثور على الصورة حسب المعرف
    const image = images.find(img => img.id === id);
    
    if (!image) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الصورة المحددة",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من اكتمال البيانات قبل الإرسال
    if (!validateRequiredFields(image)) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // محاولة إرسال البيانات إلى API وحفظها في قاعدة البيانات
      const success = await submitToApi(id, image, user?.id);
      
      if (success) {
        toast({
          title: "تم الإرسال",
          description: "تم إرسال البيانات وحفظها بنجاح",
        });
        
        // تحديث الصورة محلياً
        updateImage(id, { submitted: true, status: "completed" });
        
        // إعادة تحميل الصور من قاعدة البيانات للتأكد من التزامن
        if (user) {
          loadUserImages(user.id, setAllImages);
        }
      }
    } catch (error) {
      console.error("خطأ في إرسال البيانات:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء محاولة إرسال البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // تعديل وظيفة حذف الصورة لتشمل الحذف من قاعدة البيانات
  const handleDelete = async (id: string) => {
    try {
      // محاولة حذف السجل من قاعدة البيانات أولاً
      if (user) {
        await deleteImageFromDatabase(id);
      }
      
      // ثم حذفه من الحالة المحلية
      deleteImage(id);
      
      return true;
    } catch (error) {
      console.error("خطأ في حذف السجل:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف السجل",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // إضافة وظيفة إعادة تشغيل عملية المعالجة عندما تتجمد العملية
  const retryProcessing = useCallback(() => {
    if (fileUploadData && fileUploadData.manuallyTriggerProcessingQueue) {
      console.log("إعادة تشغيل عملية معالجة الصور...");
      fileUploadData.manuallyTriggerProcessingQueue();
      toast({
        title: "تم إعادة التشغيل",
        description: "تم إعادة تشغيل عملية معالجة الصور بنجاح",
      });
      return true;
    }
    return false;
  }, [toast]);

  // وظيفة مسح ذاكرة التخزين المؤقت للصور المعالجة
  const clearImageCache = useCallback(() => {
    clearProcessedImagesCache();
    if (fileUploadData && fileUploadData.clearProcessedHashesCache) {
      fileUploadData.clearProcessedHashesCache();
    }
    toast({
      title: "تم المسح",
      description: "تم مسح ذاكرة التخزين المؤقت للصور المعالجة",
    });
  }, [clearProcessedImagesCache, toast]);
  
  const fileUploadData = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates
  });

  const { 
    isProcessing, 
    handleFileChange,
    activeUploads,
    queueLength,
    useGemini
  } = fileUploadData;

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages(user.id, setAllImages);
      
      // تنظيف السجلات القديمة عند بدء التطبيق
      cleanupOldRecords(user.id);
    }
  }, [user]);

  return {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    useGemini,
    loadUserImages: () => {
      if (user) {
        loadUserImages(user.id, setAllImages);
        // تنظيف السجلات القديمة أيضًا عند إعادة تحميل الصور يدويًا
        cleanupOldRecords(user.id);
      }
    },
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    isDuplicateImage,
    clearImageCache,
    retryProcessing,
    activeUploads,
    queueLength
  };
};

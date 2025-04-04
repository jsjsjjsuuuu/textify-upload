
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useImageStorage } from "@/hooks/useImageStorage";

// متغير لتتبع ما إذا كانت عملية التنظيف جارية
let isCleanupRunning = false;

export const useImageProcessingCore = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ total: number; current: number; errors: number; }>({
    total: 0,
    current: 0,
    errors: 0
  });
  
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
    bookmarkletStats,
    setBookmarkletStats,
    isImageProcessed,
    markImageAsProcessed,
    clearProcessedImagesCache
  } = useImageStats();
  
  const { saveProcessedImage } = useSavedImageProcessing(updateImage, setAllImages);
  
  const {
    isUploading,
    uploadImageToStorage,
    deleteImageFromStorage,
    prepareNewImage,
    ensureStorageBucketExists
  } = useImageStorage();
  
  const { 
    isLoadingUserImages,
    loadUserImages: loadUserImagesFromDb,
    saveImageToDatabase,
    handleSubmitToApi: submitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow: runDbCleanupNow
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

  // إنشاء كائن useFileUpload في بداية الملف
  const fileUploadData = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates
  });
  
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
  }, [toast, fileUploadData]);

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
  }, [clearProcessedImagesCache, toast, fileUploadData]);
  
  // وظيفة إيقاف عملية المعالجة مؤقتًا
  const pauseProcessing = useCallback(() => {
    if (fileUploadData && fileUploadData.pauseProcessing) {
      console.log("إيقاف عملية معالجة الصور مؤقتًا...");
      fileUploadData.pauseProcessing();
      toast({
        title: "تم الإيقاف مؤقتًا",
        description: "تم إيقاف عملية معالجة الصور مؤقتًا، يمكنك إعادة تشغيلها لاحقًا",
      });
      return true;
    }
    return false;
  }, [toast, fileUploadData]);

  const { 
    isProcessing, 
    handleFileChange,
    activeUploads,
    queueLength,
    useGemini,
    pauseProcessing: filePauseProcessing,
    clearQueue,
  } = fileUploadData;

  // تنفيذ عملية التنظيف مرة واحدة فقط
  const runCleanupNow = useCallback(async () => {
    if (!user || isCleanupRunning) return false;
    
    isCleanupRunning = true;
    try {
      await runDbCleanupNow(user.id);
      return true;
    } finally {
      // السماح بتشغيل التنظيف مرة أخرى بعد الانتهاء
      setTimeout(() => {
        isCleanupRunning = false;
      }, 5000);
    }
  }, [user, runDbCleanupNow]);

  // تعديل وظيفة تحميل صور المستخدم لتجنب الاستدعاءات المتكررة
  const loadUserImages = useCallback(() => {
    if (user) {
      console.log("تحميل صور المستخدم...");
      loadUserImagesFromDb(user.id, setAllImages);
      
      // تشغيل التنظيف مرة واحدة فقط عند التحميل الأولي
      if (!isCleanupRunning) {
        console.log("تشغيل التنظيف التلقائي عند تحميل الصور...");
        runCleanupNow();
      }
    }
  }, [user, loadUserImagesFromDb, setAllImages, runCleanupNow]);

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
      // العثور على الصورة لمعرفة مسار التخزين
      const image = images.find(img => img.id === id);
      
      if (image?.storage_path) {
        // حذف الملف من التخزين أولاً
        await deleteImageFromStorage(image.storage_path);
      }
      
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

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    // التأكد من وجود مخزن الصور
    if (user) {
      ensureStorageBucketExists();
    }
  }, [user, ensureStorageBucketExists]);
  
  // تحميل صور المستخدم عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages();
    }
  }, [user, loadUserImages]);

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
    loadUserImages,
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    isDuplicateImage,
    clearImageCache,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    activeUploads,
    queueLength
  };
};

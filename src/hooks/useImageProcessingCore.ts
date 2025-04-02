import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { supabase } from "@/integrations/supabase/client";

// محددات عدد محاولات إعادة المعالجة لتجنب الحلقات اللانهائية
const MAX_PROCESSING_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 ثوانٍ
const GLOBAL_RETRY_LIMIT = 10; // الحد الأقصى للمحاولات العامة

// إضافة متغير عام لتتبع حالة الإعادة والمحاولات
let hasGlobalReset = false;
let globalRetryCount = 0;
let lastRetryTime = 0;

export const useImageProcessingCore = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedReprocessing, setHasAttemptedReprocessing] = useState(false);
  const [pendingImageCount, setPendingImageCount] = useState(0);
  const [lastPendingCheck, setLastPendingCheck] = useState(0);
  const [processingAttempts, setProcessingAttempts] = useState<Record<string, number>>({});
  
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

  // إنشاء كائن useFileUpload 
  const fileUploadData = useFileUpload();
  
  // تحسين وظيفة إعادة تشغيل عملية المعالجة مع منع الحلقة التكرارية
  const retryProcessing = useCallback(() => {
    // فحص الوقت المنقضي منذ آخر محاولة
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime;
    
    // تجنب المحاولات المتكررة جدًا
    if (timeSinceLastRetry < RETRY_DELAY) {
      console.log(`تجاهل المحاولة: مر فقط ${timeSinceLastRetry}ms منذ آخر محاولة، مطلوب ${RETRY_DELAY}ms على الأقل`);
      return false;
    }
    
    // تحقق ما إذا تم الوصول إلى الحد العام للمحاولات
    if (globalRetryCount >= GLOBAL_RETRY_LIMIT) {
      console.log(`تجاوز الحد الأقصى للمحاولات العام (${GLOBAL_RETRY_LIMIT}). إعادة تعيين العداد...`);
      toast({
        title: "تم تجاوز الحد الأقصى للمحاولات",
        description: "لقد تم محاولة إعادة المعالجة عدة مرات دون نجاح. يرجى إعادة تحميل الصفحة أو المحاولة لاحقًا.",
        variant: "destructive"
      });
      
      // إعادة تعيين العداد بعد 10 دقائق
      setTimeout(() => {
        globalRetryCount = 0;
      }, 10 * 60 * 1000);
      
      return false;
    }
    
    // تعيين وقت آخر محاولة ومسح عداد المحاولات السابقة
    setLastPendingCheck(now);
    lastRetryTime = now;
    globalRetryCount++;
    
    // التحقق من وجود معالجة فعلية قبل المحاولة
    const hasProcessingImages = images.some(img => img.status === "processing");
    const hasPendingImages = images.some(img => img.status === "pending");
    
    if (!hasProcessingImages && !hasPendingImages) {
      console.log("لا توجد صور في قائمة الانتظار أو المعالجة قيد التقدم بالفعل");
      return false;
    }
    
    // التحقق من عدد محاولات كل صورة وتحديث الصور التي تجاوزت الحد
    let attemptedToFixImages = false;
    
    images.forEach(img => {
      if (img.status === "processing") {
        const attempts = processingAttempts[img.id] || 0;
        
        if (attempts >= MAX_PROCESSING_ATTEMPTS) {
          console.log(`الصورة ${img.id} تجاوزت الحد الأقصى من المحاولات (${MAX_PROCESSING_ATTEMPTS})، تغيير الحالة إلى 'error'`);
          updateImage(img.id, { status: "error", extractedText: "تجاوز الحد الأقصى من محاولات المعالجة" });
          attemptedToFixImages = true;
        } else {
          // زيادة عدد المحاولات
          setProcessingAttempts(prev => ({
            ...prev,
            [img.id]: (prev[img.id] || 0) + 1
          }));
        }
      }
    });
    
    if (attemptedToFixImages) {
      console.log("تم تحديث حالة الصور العالقة، لا حاجة لإعادة تشغيل المعالجة");
      return true;
    }
    
    if (fileUploadData && fileUploadData.manuallyTriggerProcessingQueue) {
      console.log("إعادة تشغيل عملية معالجة الصور... (المحاولة العامة رقم " + globalRetryCount + ")");
      fileUploadData.manuallyTriggerProcessingQueue();
      
      toast({
        title: "تم إعادة التشغيل",
        description: "تم إعادة تشغيل عملية معالجة الصور بنجاح",
      });
      return true;
    }
    return false;
  }, [toast, fileUploadData, images, processingAttempts, updateImage]);

  // وظيفة مسح ذاكرة التخزين المؤقت للصور المعالجة
  const clearImageCache = useCallback(() => {
    clearProcessedImagesCache();
    if (fileUploadData && fileUploadData.clearProcessedHashesCache) {
      fileUploadData.clearProcessedHashesCache();
    }
    // إعادة تعيين عدادات المحاولات
    setProcessingAttempts({});
    globalRetryCount = 0;
    
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

  // استخدام خصائص fileUploadData
  const { 
    isProcessing, 
    handleImageUpload
  } = fileUploadData;

  // إنشاء وظائف الواجهة المطلوبة
  const handleFileChange = useCallback((files: FileList) => {
    return handleImageUpload(files);
  }, [handleImageUpload]);

  const activeUploads = fileUploadData?.activeUploads || 0;
  const queueLength = fileUploadData?.queueLength || 0;
  const useGemini = fileUploadData?.useGemini || false;
  const uploadLimitInfo = fileUploadData?.uploadLimitInfo || {
    subscription: 'standard',
    dailyLimit: 3,
    currentCount: 0,
    remainingUploads: 3
  };
  
  const clearQueue = useCallback(() => {
    if (fileUploadData && fileUploadData.clearQueue) {
      return fileUploadData.clearQueue();
    }
    return false;
  }, [fileUploadData]);

  // إعادة هيكلة وظيفة handleSubmitToApi
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

  // تعديل وظيفة حذف الصورة 
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

  // تحسين آلية معالجة الصور المعلقة مع الحد من تكرار المحاولات
  const handlePendingImages = useCallback(async () => {
    // تجاهل المعالجة إذا تم بالفعل محاولة معالجة الصور المعلقة في هذه الجلسة
    // أو إذا تم إعادة تعيين النظام مؤخرًا أو وصلنا للحد الأقصى من المحاولات
    if (hasAttemptedReprocessing || hasGlobalReset || !user || images.length === 0 || globalRetryCount >= GLOBAL_RETRY_LIMIT) {
      return;
    }
    
    // زيادة عدد صور في الانتظار
    setPendingImageCount(prev => prev + 1);
    
    // تحقق من وجود صور في انتظار المعالجة
    const pendingImages = images.filter(img => img.status === "pending" || img.status === "error");
    
    if (pendingImages.length > 0) {
      console.log(`تم العثور على ${pendingImages.length} صورة في انتظار المعالجة، سيتم محاولة إعادة معالجتها...`);
      
      // وضع علامة أننا قمنا بمحاولة إعادة المعالجة لتجنب التكرار
      setHasAttemptedReprocessing(true);
      
      // محاولة إعادة المعالجة فقط مرة واحدة
      retryProcessing();
      
      // منع المزيد من المحاولات تلقائيًا لتجنب الحلقات اللانهائية
      setTimeout(() => {
        setHasAttemptedReprocessing(false);
      }, 60000); // السماح بمحاولة أخرى بعد دقيقة واحدة
    }
  }, [images, user, retryProcessing, hasAttemptedReprocessing]);

  // تحسين وظيفة إعادة التعيين
  const resetProcessingState = useCallback(async () => {
    console.log("إعادة تعيين حالة المعالجة بالكامل...");
    
    // تعيين المتغير العام لمنع المزيد من المحاولات التلقائية
    hasGlobalReset = true;
    
    // إعادة تعيين المتغيرات وعدادات المحاولات
    setHasAttemptedReprocessing(false);
    setPendingImageCount(0);
    setProcessingAttempts({});
    globalRetryCount = 0;
    lastRetryTime = 0;
    
    // تحديث الصور العالقة في قاعدة البيانات
    if (user?.id) {
      try {
        // تحديث حالة جميع الصور التي في حالة "processing" إلى "pending"
        const { error } = await supabase
          .from('images') // تصحيح اسم الجدول من receipt_images إلى images
          .update({ status: 'pending' })
          .eq('user_id', user.id)
          .eq('status', 'processing');
          
        if (error) {
          console.error("خطأ في تحديث حالة الصور العالقة:", error);
        } else {
          console.log("تم تحديث حالة الصور العالقة بنجاح");
        }
      } catch (error) {
        console.error("خطأ في تحديث قاعدة البيانات:", error);
      }
    }
    
    // السماح بمحاولات المعالجة التلقائية مرة أخرى بعد دقيقتين
    setTimeout(() => {
      hasGlobalReset = false;
    }, 120000);
    
    // مسح ذاكرة التخزين المؤقت
    clearImageCache();
    
    // مسح قائمة الانتظار
    if (fileUploadData && fileUploadData.clearQueue) {
      fileUploadData.clearQueue();
    }
  }, [user, clearImageCache, fileUploadData]);

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages(user.id, setAllImages);
      
      // تنظيف السجلات القديمة عند بدء التطبيق
      cleanupOldRecords(user.id);
    }
  }, [user]);
  
  // تحسين آلية معالجة الصور المعلقة - تشغيل مرة واحدة فقط عند تحميل المكون
  useEffect(() => {
    // انتظر فترة قصيرة قبل محاولة معالجة الصور المعلقة
    const timer = setTimeout(() => {
      if (user && images.length > 0 && !hasGlobalReset && globalRetryCount < GLOBAL_RETRY_LIMIT) {
        handlePendingImages();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [user, images.length]); // تعتمد فقط على وجود المستخدم وعدد الصور

  // تصدير كائن النتائج
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
    pauseProcessing,
    clearQueue,
    activeUploads,
    queueLength,
    uploadLimitInfo,
    resetProcessingState
  };
};

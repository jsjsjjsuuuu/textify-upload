import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData, CustomImageData } from "@/types/ImageData";
import { useImageState } from "../imageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { UseImageDatabaseConfig } from "@/hooks/useImageDatabase/types";

export const useImageProcessingCore = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // استخدام useImageState المحدث مع الخصائص الإضافية
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
    removeDuplicates,
    hiddenImageIds,
    hideImage, 
    unhideImage,
    unhideAllImages
  } = useImageState();
  
  const {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats
  } = useImageStats();
  
  // استخدام اكتشاف التكرار مع الواجهات المحدثة
  const duplicateDetectionTools = useDuplicateDetection({ enabled: true });
  
  // جلب وظائف معالجة الصور الجديدة المتوافقة
  const { processFileWithOcr } = useOcrProcessing();
  const { processFileWithGemini } = useGeminiProcessing();
  
  // تحسين استخدام useSavedImageProcessing مع الميزات الإضافية
  const {
    isSubmitting: isSavingToDatabase,
    setIsSubmitting: setSavingToDatabase,
    saveProcessedImage
  } = useSavedImageProcessing(updateImage, setAllImages);
  
  const updateImageConfig: UseImageDatabaseConfig = {
    updateImage: updateImage
  };

  const { 
    isLoadingUserImages,
    loadUserImages,
    saveImageToDatabase,
    handleSubmitToApi: submitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  } = useImageDatabase(updateImageConfig);

  // التحقق من وجود المفتاح القديم وتحديثه إذا لزم الأمر
  useEffect(() => {
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8"; // المفتاح القديم
    const storedApiKey = localStorage.getItem("geminiApiKey");
    
    // إذا كان المفتاح المخزن هو المفتاح القديم، قم بإزالته
    if (storedApiKey === oldApiKey) {
      console.log("تم اكتشاف مفتاح API قديم. جاري المسح...");
      localStorage.removeItem("geminiApiKey");
      
      // تعيين المفتاح الجديد
      const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
      localStorage.setItem("geminiApiKey", newApiKey);
      
      toast({
        title: "تم تحديث مفتاح API",
        description: "تم تحديث مفتاح Gemini API بنجاح",
      });
    }
  }, [toast]);
  
  // التحقق من اكتمال البيانات المطلوبة للصورة
  const validateRequiredFields = (image: CustomImageData): boolean => {
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

  // إعادة هيكلة وظيفة handleSubmitToApi لتستخدم وظيفة إخفاء الصورة بعد الإرسال
  const handleSubmitToApi = async (id: string) => {
    // العثور على الصورة حسب المعرف
    const image = images.find(img => img.id === id);
    
    if (!image) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الصورة المحددة",
        variant: "destructive"
      });
      return false;
    }
    
    // التحقق من اكتمال البيانات قبل الإرسال
    if (!validateRequiredFields(image as CustomImageData)) {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      console.log("جاري إرسال البيانات للصورة:", id);
      // محاولة إرسال البيانات إلى API وحفظها في قاعدة البيانات
      const success = await submitToApi(id, image, user?.id);
      
      if (success) {
        console.log("تم إرسال البيانات بنجاح للصورة:", id);
        
        // تحديث الصورة محلياً
        updateImage(id, { submitted: true, status: "completed" });
        
        // تسجيل الصورة كمعالجة لتجنب إعادة المعالجة
        duplicateDetectionTools.markImageAsProcessed(image);
        
        toast({
          title: "تم الإرسال",
          description: "تم إرسال البيانات وحفظها بنجاح",
        });
        
        // تأكد من وجود وظيفة hideImage قبل استدعائها
        console.log("جاري إخفاء الصورة بعد الإرسال الناجح:", id);
        hideImage(id); // استدعاء مباشر لوظيفة hideImage
        
        return true;
      } else {
        console.error("فشل في إرسال البيانات للصورة:", id);
        return false;
      }
    } catch (error) {
      console.error("خطأ في إرسال البيانات:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء محاولة إرسال البيانات",
        variant: "destructive"
      });
      return false;
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
  
  // استدعاء useFileUpload مع تحسين آلية التعامل مع الصور
  const { 
    isProcessing, 
    handleFileChange,
    activeUploads,
    queueLength,
    cleanupDuplicates
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    removeDuplicates, // تمرير وظيفة removeDuplicates المحدثة
    // تمرير وظائف معالجة الصور المحدثة
    processWithOcr: processFileWithOcr,
    processWithGemini: processFileWithGemini,
    // استخدام الأداة كما هي بدلاً من تمريرها كخاصية منفصلة
    processedImage: {
      isDuplicateImage: duplicateDetectionTools.isDuplicateImage, // استخدام isDuplicateImage بدلاً من checkDuplicateImage
      markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed
    }
  });

  
  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages(user.id, (loadedImages) => {
        // تطبيق فلتر الصور المخفية على الصور المحملة
        const filteredImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        setAllImages(filteredImages);
      });
      
      // تنظيف السجلات القديمة عند بدء التطبيق
      cleanupOldRecords(user.id);
    }
  }, [user, hiddenImageIds]);

  // تعديل دالة جلب الصور ليكون لها نفس التوقيع المتوقع
  const modifiedLoadUserImages = useCallback((userId: string, callback?: (images: ImageData[]) => void): Promise<void> => {
    return new Promise((resolve) => {
      loadUserImages(userId, (images) => {
        if (callback) callback(images);
        resolve();
      });
    });
  }, [loadUserImages]);

  // تصدير الوظائف المتاحة
  return {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    bookmarkletStats,
    hiddenImageIds,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    hideImage,
    loadUserImages: modifiedLoadUserImages, // استخدام الدالة المعدلة
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    activeUploads,
    queueLength,
    unhideImage,
    unhideAllImages,
    clearOldApiKey: () => {
      const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8"; // المفتاح القديم
      const storedApiKey = localStorage.getItem("geminiApiKey");
      
      if (storedApiKey === oldApiKey) {
        console.log("تم اكتشاف مفتاح API قديم. جاري المسح...");
        localStorage.removeItem("geminiApiKey");
        
        // تعيين المفتاح الجديد
        const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
        localStorage.setItem("geminiApiKey", newApiKey);
        
        toast({
          title: "تم تحديث مفتاح API",
          description: "تم تحديث مفتاح Gemini API بنجاح",
        });
        
        return true;
      }
      
      return false;
    },
    // استخدام التعريفات الجديدة والمحدثة
    isDuplicateImage: duplicateDetectionTools.isDuplicateImage,
    checkDuplicateImage: duplicateDetectionTools.isDuplicateImage,
    markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed
  };
};

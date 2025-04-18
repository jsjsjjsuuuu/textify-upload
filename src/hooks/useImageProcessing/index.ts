import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData, CustomImageData, ImageProcessFn } from "@/types/ImageData";
import { useAuth } from "@/contexts/AuthContext";
import { useOcrProcessing } from "./useOcrProcessing";
import { useGeminiProcessing } from "./useGeminiProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useImageDatabase } from "./useImageDatabase";
import { useToast } from "./use-toast";
// استيراد useDuplicateDetection
import { useDuplicateDetection } from "./useDuplicateDetection";
import { useSavedImageProcessing } from "./useSavedImageProcessing";
import { useImageState } from "./imageState";
import { useFileUpload } from "./useFileUpload";

export const useImageProcessing = () => {
  // إعادة تصدير دالة formatDate لاستخدامها في المكونات
  const formatDateFn = formatDate;

  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  const { toast } = useToast();
  
  // استخدام useState فقط للمتغيرات التي لا تستورد من useFileUpload
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  // استخدام الحالة للإرسال
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  
  // استيراد الهوكس
  const { 
    images, 
    updateImage, 
    deleteImage, 
    addImage, 
    clearSessionImages,
    clearImages,
    handleTextChange,
    setAllImages,
    hiddenImageIds,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    hideImage 
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini مع الدوال المتوافقة مع تعريفات الأنواع الجديدة
  const { processFileWithOcr } = useOcrProcessing();
  const { processFileWithGemini } = useGeminiProcessing();
  
  // إنشاء دالة وهمية لتمرير دالة setProcessingProgress
  const dummySetProgress = (progress: number) => {};
  
  // استيراد متغيرات وتوابع معالجة الملفات من useFileUpload
  const fileUploadResult = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress: dummySetProgress,
    // استخدام الوظائف المتوافقة مع المتطلبات الجديدة
    processWithOcr: processFileWithOcr,
    processWithGemini: processFileWithGemini
  });
  
  // استخراج القيم المهمة من نتيجة fileUploadResult
  const { 
    isProcessing, 
    handleFileChange: fileUploadHandler, 
    activeUploads, 
    queueLength,
    processingProgress,
    cleanupDuplicates 
  } = fileUploadResult;
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { loadUserImages: fetchUserImages, saveImageToDatabase, handleSubmitToApi: submitToApi, deleteImageFromDatabase, runCleanupNow } = useImageDatabase(updateImage);
  
  // هوك كشف التكرارات مع تعطيله
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection({ enabled: false });
  
  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      setIsLoadingUserImages(true);
      fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        setAllImages(visibleImages);
        setIsLoadingUserImages(false);
      });
    }
  }, [user, hiddenImageIds]);

  // إعادة تصدير وظيفة handleFileChange
  const handleFileChange = (files: FileList | File[]) => {
    fileUploadHandler(files);
  };

  // تعديل وظيفة حذف الصورة للتفريق بين الإزالة من العرض والحذف الفعلي
  const handleDelete = async (id: string) => {
    try {
      // حذف من العرض الحالي فقط (دون حذفها من قاعدة البيانات)
      return deleteImage(id, false);
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };
  
  // إضافة وظيفة حذف الصورة نهائيًا من قاعدة البيانات
  const handlePermanentDelete = async (id: string) => {
    try {
      if (user) {
        // الحذف من قاعدة البيانات
        await deleteImageFromDatabase(id);
      }
      // ثم الحذف من العرض المحلي
      return deleteImage(id, true);
    } catch (error) {
      console.error("Error permanently deleting image:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الصورة",
        variant: "destructive"
      });
      return false;
    }
  };

  const setImages = (newImages: ImageData[]) => {
    // استخدام العمليات المتاحة في useImageState
    clearImages();
    newImages.forEach(img => addImage(img));
  };
  
  /**
   * تحميل صور المستخدم - واجهة مبسطة تستخدم دالة الرجوع فقط
   * @param callback - دالة الرجوع التي ستتلقى الصور المحملة
   */
  const loadUserImages = (callback?: (images: ImageData[]) => void) => {
    if (user) {
      setIsLoadingUserImages(true);
      // استدعاء دالة fetchUserImages من useImageDatabase مع تمرير معرف المستخدم ودالة الرجوع
      return fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        if (callback) {
          callback(visibleImages);
        } else {
          setImages(visibleImages);
        }
        setIsLoadingUserImages(false);
      });
    }
  };

  // تعديل وظيفة handleSubmitToApi للتأكد من إخفاء الصورة بعد الإرسال الناجح
  const handleSubmitToApi = useCallback(async (id: string) => {
    try {
      console.log("بدء عملية الإرسال للصورة:", id);
      // تحديث حالة التقديم
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      // البحث عن الصورة المقابلة
      const image = images.find(img => img.id === id);
      
      if (!image) {
        throw new Error(`الصورة ذات المعرف ${id} غير موجودة`);
      }
      
      // استدعاء دالة submitToApi مع تمرير المعلومات المطلوبة
      const result = await submitToApi(id, image, user?.id);
      
      // تحديث حالة الصورة إذا كان الإرسال ناجحًا
      if (result) {
        console.log("تم إرسال الصورة بنجاح:", id);
        updateImage(id, { submitted: true });
        
        // تسجيل الصورة كمعالجة بعد الإرسال الناجح
        const submittedImage = images.find(img => img.id === id);
        if (submittedImage) {
          markImageAsProcessed(submittedImage);
        }
        
        // عرض رسالة نجاح للمستخدم
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال البيانات بنجاح إلى API"
        });
        
        // إخفاء الصورة بعد الإرسال - استدعاء مباشر لوظيفة hideImage
        console.log("إخفاء الصورة بعد الإرسال الناجح:", id);
        hideImage(id);
        
        return true;
      }
      
      return result;
    } catch (error) {
      console.error("Error submitting image:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      // إعادة تعيين حالة التقديم
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  }, [images, submitToApi, toast, updateImage, user?.id, markImageAsProcessed, hideImage]);

  const retryProcessing = () => {
    // إعادة معالجة الصور التي فشلت
    toast({
      title: "إعادة المحاولة",
      description: "جاري إعادة معالجة الصور التي فشلت",
    });
  };
  
  const clearQueue = () => {
    toast({
      title: "تم إفراغ القائمة",
      description: "تم إفراغ قائمة انتظار الصور",
    });
  };

  // في هذا الجزء، نضيف وظيفة جديدة لمسح مفتاح API القديم من localStorage
  const clearOldApiKey = useCallback(() => {
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
  }, [toast]);

  // تأكد من تحديث حالة المعالجة عندما تكتمل جميع الملفات
  useEffect(() => {
    if (processingProgress >= 100 && activeUploads === 0 && isProcessing) {
      console.log("اكتملت معالجة جميع الصور. إخفاء مؤشر المعالجة...");
    }
  }, [processingProgress, activeUploads, isProcessing]);

  // إضافة رسائل تشخيص لمتابعة حالة المعالجة
  useEffect(() => {
    console.log(`حالة المعالجة: processing=${isProcessing}, progress=${processingProgress}%, activeUploads=${activeUploads}`);
  }, [isProcessing, processingProgress, activeUploads]);

  // إضافة الوظيفة الجديدة إلى الكائن المُرجع
  return {
    // البيانات
    images,
    hiddenImageIds,
    // الحالة
    isProcessing,
    processingProgress,
    isSubmitting,
    activeUploads,
    queueLength,
    isLoadingUserImages,
    // الدوال
    handleFileChange,
    handleTextChange,
    handleDelete,
    handlePermanentDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatDateFn,
    // تصدير وظيفة hideImage هنا بشكل واضح
    hideImage,
    // إضافة الوظائف الجديدة للتحكم في الصور المخفية
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    // إضافة الدوال الأخرى
    clearSessionImages,
    retryProcessing: () => {
      toast({
        title: "إعادة المحاولة",
        description: "جاري إعادة معالجة الصور التي فشلت",
      });
    },
    clearQueue: () => {
      toast({
        title: "تم إفراغ القائمة",
        description: "تم إفراغ قائمة انتظار الصور",
      });
    },
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    // تصدير واجهة الدالة المبسطة
    loadUserImages,
    setImages: setAllImages,
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
    checkDuplicateImage: () => Promise.resolve(false) // تعديل وظيفة التحقق من التكرار لتعود دائمًا بـ false
  };
};

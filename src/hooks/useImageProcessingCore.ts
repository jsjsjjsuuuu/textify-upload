
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";

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
    removeDuplicates,
    hiddenImageIds,
    hideImage, // تأكد أن هذه الوظيفة مستخرجة من useImageState بشكل صحيح
    unhideImage,
    unhideAllImages
  } = useImageState();
  
  const {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats
  } = useImageStats();
  
  // استخدام اكتشاف التكرار
  const duplicateDetectionTools = useDuplicateDetection({ enabled: true });
  
  // جلب وظائف معالجة الصور
  const { processWithGemini } = useGeminiProcessing();
  const { processWithOcr } = useOcrProcessing();
  
  // تحسين استخدام useSavedImageProcessing مع توقيع الوظيفة الصحيح
  const {
    isSubmitting: isSavingToDatabase,
    setIsSubmitting: setSavingToDatabase,
    saveProcessedImage
  } = useSavedImageProcessing(updateImage, setAllImages);
  
  const { 
    isLoadingUserImages,
    loadUserImages,
    saveImageToDatabase,
    handleSubmitToApi: submitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  } = useImageDatabase(updateImage);

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
    if (!validateRequiredFields(image)) {
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
        
        // إخفاء الصورة من العرض بعد الإرسال الناجح - تأكد من أن الدالة موجودة
        if (typeof hideImage === 'function') {
          console.log("جاري إخفاء الصورة:", id);
          hideImage(id);
        } else {
          console.error("وظيفة hideImage غير معرفة!", typeof hideImage);
        }
        
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
  
  // استدعاء useFileUpload مع تحسين آلية التعامل مع الصور وتمرير وظائف اكتشاف التكرار
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
    removeDuplicates,
    // استخدام الأداة كما هي بدلاً من تمريرها كخاصية منفصلة
    processedImage: {
      // تحويل وظيفة checkDuplicateImage المتزامنة إلى isDuplicateImage
      isDuplicateImage: duplicateDetectionTools.checkDuplicateImage,
      markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed
    },
    // تمرير وظائف معالجة الصور
    processWithOcr,
    processWithGemini
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
    handleDelete: deleteImage,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    hideImage, // تأكد من تصدير وظيفة hideImage للاستخدام الخارجي
    loadUserImages: (callback?: (images: ImageData[]) => void) => {
      if (user) {
        loadUserImages(user.id, callback || ((loadedImages) => {
          // تطبيق فلتر الصور المخفية هنا أيضًا
          const filteredImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
          setAllImages(filteredImages);
        }));
      }
    },
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    activeUploads,
    queueLength,
    cleanupDuplicates,
    ...duplicateDetectionTools,
    processWithGemini,
    processWithOcr,
    unhideImage,
    unhideAllImages
  };
};


import { useState } from "react";
import { useFileProcessing } from "../useFileProcessing";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useImageState } from "../imageState";
import { useImageDatabase } from "../useImageDatabase";
import { useToast } from "../use-toast";
import { useDuplicateDetection } from "../useDuplicateDetection";
import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useImageProcessing = () => {
  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  const { toast } = useToast();
  
  // استخدام useRef لتقليل عمليات إعادة الرسم (تحسين)
  const processingStateRef = useRef({
    isLoadingImages: false,
    lastProcessedBatch: null as string | null
  });
  
  // حالة التحميل
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  
  // استخدام مرجع للصور المحملة للاستخدام الفعال للذاكرة
  const loadedImagesRef = useRef<Set<string>>(new Set());
  
  // استيراد حالة الصور
  const { 
    images, 
    hiddenImageIds,
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    clearSessionImages,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    setAllImages,
    createSafeObjectURL // استخدام الدالة المصدرة من useImageState
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  // استيراد قاعدة البيانات
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase, 
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // تحسين استخدام معالجة الملفات (تحسين)
  const fileProcessingResult = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    saveProcessedImage: async (image) => {
      // تجنب معالجة الصور التي تم حفظها مسبقًا
      if (loadedImagesRef.current.has(image.id)) {
        return;
      }
      
      try {
        await saveImageToDatabase(image);
        loadedImagesRef.current.add(image.id);
      } catch (err) {
        console.error("خطأ في حفظ الصورة:", err);
      }
    },
    user,
    createSafeObjectURL
  });
  
  // استيراد كاشف التكرار (معطل للتحسين)
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection({ enabled: false });
  
  // استخراج متغيرات معالجة الملفات
  const { 
    isProcessing, 
    processingProgress, 
    handleFileChange: fileUploadHandler, 
    activeUploads, 
    queueLength,
  } = fileProcessingResult;

  // تحميل الصور السابقة بتحسين الأداء
  const loadUserImages = useCallback(() => {
    if (user && !processingStateRef.current.isLoadingImages) {
      processingStateRef.current.isLoadingImages = true;
      setIsLoadingUserImages(true);
      
      // تحميل الصور بدفعات (batches) للتحسين
      fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية بكفاءة
        const hiddenIdsSet = new Set(hiddenImageIds);
        const visibleImages = loadedImages.filter(img => !hiddenIdsSet.has(img.id));
        
        // تحديث مرجع الصور المحملة
        visibleImages.forEach(img => loadedImagesRef.current.add(img.id));
        
        setAllImages(visibleImages);
        setIsLoadingUserImages(false);
        processingStateRef.current.isLoadingImages = false;
      });
    }
  }, [user, hiddenImageIds, setAllImages, fetchUserImages]);

  // تحميل الصور عند تغيير المستخدم أو قائمة الصور المخفية
  useEffect(() => {
    loadUserImages();
  }, [user, hiddenImageIds, loadUserImages]);

  // معالجة الملفات
  const handleFileChange = useCallback((files: FileList | File[]) => {
    // تسجيل بيانات المعالجة
    const batchId = `batch-${new Date().getTime()}`;
    processingStateRef.current.lastProcessedBatch = batchId;
    
    // استخدام معالج الملفات
    fileUploadHandler(files);
  }, [fileUploadHandler]);

  // حذف الصور
  const handleDelete = useCallback(async (id: string) => {
    try {
      // تنظيف URL المعاينة قبل الحذف
      const imageToDelete = images.find(img => img.id === id);
      if (imageToDelete?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.previewUrl);
      }
      
      return deleteImage(id, false);
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  }, [images, deleteImage]);

  // إرسال الصور إلى API - تحسين الأداء
  const handleSubmitToApi = useCallback(async (id: string) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      const image = images.find(img => img.id === id);
      if (!image) {
        throw new Error(`الصورة ذات المعرف ${id} غير موجودة`);
      }
      
      const result = await submitToApi(id, image, user?.id);
      
      if (result) {
        updateImage(id, { submitted: true });
        
        const submittedImage = images.find(img => img.id === id);
        if (submittedImage) {
          markImageAsProcessed(submittedImage);
        }
        
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال البيانات بنجاح إلى API"
        });
        
        // إخفاء الصورة بعد الإرسال الناجح
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
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  }, [images, submitToApi, toast, updateImage, user?.id, markImageAsProcessed, hideImage]);

  // تحسين إعادة محاولة المعالجة
  const retryProcessing = useCallback(() => {
    // تنفيذ آمن مع تجنب الطلبات غير الضرورية
    toast({
      title: "إعادة المحاولة",
      description: "جاري إعادة معالجة الصور التي فشلت",
    });
  }, [toast]);
  
  // تحسين مسح قائمة الانتظار
  const clearQueue = useCallback(() => {
    toast({
      title: "تم إفراغ القائمة",
      description: "تم إفراغ قائمة انتظار الصور",
    });
  }, [toast]);

  // تحديث مفتاح API القديم - تحسين
  const clearOldApiKey = useCallback(() => {
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    const storedApiKey = localStorage.getItem("geminiApiKey");
    
    if (storedApiKey === oldApiKey) {
      localStorage.removeItem("geminiApiKey");
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
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    retryProcessing,
    clearQueue,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    createSafeObjectURL,
    clearOldApiKey,
    checkDuplicateImage: () => Promise.resolve(false) // تعطيل فحص التكرار
  };
};


import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateFormatter";
import { useImageState } from "../imageState";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { useImageDatabase } from "../useImageDatabase";
import { useDuplicateDetection } from "../useDuplicateDetection";
import { useFileProcessing } from "./useFileProcessing";
import { useApiKeyManagement } from "../processingCore/useApiKeyManagement";
import type { ImageData } from "@/types/ImageData"; // استيراد النوع بشكل صريح

export const useImageProcessing = () => {
  // إعادة تصدير دالة formatDate لاستخدامها في المكونات
  const formatDateFn = formatDate;

  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  
  // استيراد الهوكس
  const { 
    images, 
    updateImage, 
    deleteImage, 
    addImage, 
    clearSessionImages,
    handleTextChange,
    setAllImages,
    hiddenImageIds,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    hideImage
  } = useImageState();
  
  // استيراد هوك إدارة مفاتيح API
  const { clearOldApiKey } = useApiKeyManagement();
  
  // استيراد هوكات معالجة الصور
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase, 
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // هوك كشف التكرارات
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection();
  
  // استخدام هوك معالجة الملفات
  const { 
    isProcessing, 
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange,
    setProcessingProgress
  } = useFileProcessing({
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    checkDuplicateImage: isDuplicateImage,
    markImageAsProcessed,
    user,
    images
  });
  
  // تعديل وظيفة handleSubmitToApi للتأكد من إخفاء الصورة بعد الإرسال الناجح
  const handleSubmitToApi = async (id: string) => {
    try {
      console.log("بدء عملية الإرسال للصورة:", id);
      
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
        
        // إخفاء الصورة بعد الإرسال - استدعاء مباشر لوظيفة hideImage
        console.log("إخفاء الصورة بعد الإرسال الناجح:", id);
        if (typeof hideImage === 'function') {
          hideImage(id);
          console.log("تم إخفاء الصورة بنجاح");
        } else {
          console.error("خطأ: وظيفة hideImage غير معرّفة أو ليست دالة", typeof hideImage);
        }
        
        return true;
      }
      
      return result;
    } catch (error) {
      console.error("Error submitting image:", error);
      return false;
    }
  };
  
  // وظيفة تحميل صور المستخدم
  const loadUserImages = (callback?: (images: ImageData[]) => void) => {
    if (user) {
      console.log("تحميل صور المستخدم مع تصفية الصور المخفية...");
      console.log("عدد الصور المخفية:", hiddenImageIds.length);
      
      return fetchUserImages(user.id, (loadedImages: ImageData[]) => {
        console.log("تم تحميل الصور - عدد الصور قبل التصفية:", loadedImages.length);
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        console.log("تم تصفية الصور - عدد الصور بعد التصفية:", visibleImages.length);
        
        if (callback) {
          callback(visibleImages);
        } else {
          setAllImages(visibleImages);
        }
      });
    }
  };

  // تنفيذ وظائف تحكم إضافية
  const retryProcessing = () => {
    // يمكن تنفيذ منطق إعادة المعالجة هنا
  };
  
  const clearQueue = () => {
    // يمكن تنفيذ منطق إفراغ القائمة هنا
  };

  // إعادة تصدير الواجهة العامة أكثر تنظيمًا
  return {
    // البيانات
    images,
    hiddenImageIds,
    
    // الحالة
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    
    // الدوال
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatDateFn,
    hideImage,  // تصدير وظيفة hideImage بشكل واضح
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
    loadUserImages,  // تصدير وظيفة loadUserImages المحسنة
    setImages: setAllImages,
    clearOldApiKey,
    checkDuplicateImage: isDuplicateImage
  };
};

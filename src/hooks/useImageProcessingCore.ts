
import { useState, useEffect } from "react";
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
    setBookmarkletStats
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
  
  const { 
    isProcessing, 
    useGemini, 
    toggleGemini,
    handleFileChange 
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage
  });

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages(user.id, setAllImages);
      
      // تنظيف السجلات القديمة عند بدء التطبيق
      cleanupOldRecords(user.id);
    }
  }, [user]);

  // إضافة وظيفة لإعادة معالجة صورة واحدة
  const reprocessImage = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الصورة المحددة",
        variant: "destructive"
      });
      return;
    }

    try {
      // تحديث حالة الصورة إلى "قيد المعالجة"
      updateImage(id, { 
        status: "processing",
        retryCount: (image.retryCount || 0) + 1
      });

      // استخدام وظيفة معالجة الصور من useFileUpload
      const processImageWithOCR = async (file: File, image: ImageData) => {
        const { processWithOcr } = await import('@/hooks/useOcrProcessing');
        return processWithOcr(file, image);
      };

      const processImageWithGemini = async (file: File, image: ImageData) => {
        const { processWithGemini } = await import('@/hooks/useGeminiProcessing');
        return processWithGemini(file, image);
      };

      // معالجة الصورة بالطريقة المحددة
      const processedImage = useGemini 
        ? await processImageWithGemini(image.file, image)
        : await processImageWithOCR(image.file, image);
      
      // تحديث الصورة بالبيانات الجديدة
      updateImage(id, processedImage);
      
      // حفظ الصورة المعالجة في قاعدة البيانات
      await saveProcessedImage(processedImage);
      
      toast({
        title: "تمت إعادة المعالجة",
        description: "تمت إعادة معالجة الصورة بنجاح",
      });
      
      return processedImage;
    } catch (error) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      updateImage(id, { status: "error" });
      
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء محاولة إعادة معالجة الصورة",
        variant: "destructive"
      });
      
      return null;
    }
  };

  return {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    useGemini,
    toggleGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
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
    reprocessImage // إضافة وظيفة إعادة المعالجة
  };
};

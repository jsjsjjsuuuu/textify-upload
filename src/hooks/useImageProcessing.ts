
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";
import { DEFAULT_GEMINI_API_KEY, resetAllApiKeys } from "@/lib/gemini/apiKeyManager";
import { useToast } from "@/hooks/use-toast";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();
  const { toast } = useToast();

  // يجب أن تكون جميع hooks مستدعاة في كل مرة يتم فيها استدعاء الـ hook بنفس الترتيب
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem('autoExportEnabled') === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem('defaultSheetId') || ''
  );
  
  // التأكد من تعيين مفتاح Gemini عند بدء التشغيل وإعادة تعيين جميع المفاتيح
  useEffect(() => {
    // تعيين المفتاح الجديد دائمًا
    localStorage.setItem('geminiApiKey', DEFAULT_GEMINI_API_KEY);
    console.log("تم تعيين مفتاح Gemini API الرئيسي عند بدء التطبيق");
    
    // إعادة تعيين جميع المفاتيح عند بدء التطبيق
    resetAllApiKeys();
    console.log("تم إعادة تعيين جميع مفاتيح API عند بدء التطبيق");
    
    // محاولة معالجة الصور العالقة في حالة "قيد الانتظار"
    if (coreProcessing.images && coreProcessing.images.length > 0) {
      const pendingImages = coreProcessing.images.filter(img => img.status === "pending" || img.status === "processing");
      
      if (pendingImages.length > 0) {
        console.log(`تم العثور على ${pendingImages.length} صورة في انتظار المعالجة، سيتم محاولة إعادة معالجتها...`);
        
        // محاولة إعادة التشغيل تلقائيًا بعد قليل
        setTimeout(() => {
          if (coreProcessing.retryProcessing) {
            coreProcessing.retryProcessing();
            toast({
              title: "إعادة المعالجة",
              description: `تم العثور على ${pendingImages.length} صورة في انتظار المعالجة، وتمت محاولة إعادة معالجتها تلقائيًا`,
            });
          }
        }, 3000); // انتظار 3 ثوانٍ قبل محاولة المعالجة
      }
    }
  }, [coreProcessing.images]);
  
  // حفظ تفضيلات المستخدم في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('autoExportEnabled', autoExportEnabled.toString());
  }, [autoExportEnabled]);
  
  // حفظ معرف جدول البيانات الافتراضي
  useEffect(() => {
    if (defaultSheetId) {
      localStorage.setItem('defaultSheetId', defaultSheetId);
    }
  }, [defaultSheetId]);
  
  // تفعيل/تعطيل التصدير التلقائي
  const toggleAutoExport = (value: boolean) => {
    setAutoExportEnabled(value);
  };
  
  // تعيين جدول البيانات الافتراضي
  const setDefaultSheet = (sheetId: string) => {
    setDefaultSheetId(sheetId);
  };
  
  // يمكن إعادة تشغيل عملية المعالجة عندما تتوقف
  const retryProcessing = useCallback(() => {
    // إعادة تعيين جميع مفاتيح API قبل إعادة التشغيل
    resetAllApiKeys();
    console.log("تم إعادة تعيين جميع مفاتيح API قبل إعادة المحاولة");
    
    if (coreProcessing.retryProcessing) {
      console.log("إعادة تشغيل عملية معالجة الصور...");
      coreProcessing.retryProcessing();
      
      // عرض إشعار للمستخدم
      toast({
        title: "إعادة تشغيل",
        description: "تم إعادة تشغيل المعالجة للصور في قائمة الانتظار",
      });
      
      return true;
    }
    return false;
  }, [coreProcessing.retryProcessing, toast]);
  
  // وظيفة لحفظ صورة معالجة مباشرة (مفيدة لإعادة المعالجة)
  const saveProcessedImage = useCallback(async (image) => {
    if (!coreProcessing.saveProcessedImage) {
      throw new Error("وظيفة حفظ الصور المعالجة غير متوفرة");
    }
    
    try {
      // عرض إشعار بدء المعالجة
      toast({
        title: "جاري المعالجة",
        description: "جاري معالجة الصورة...",
      });
      
      // استدعاء وظيفة الحفظ الأساسية
      await coreProcessing.saveProcessedImage(image);
      
      // عرض إشعار نجاح
      toast({
        title: "تمت المعالجة",
        description: "تم معالجة الصورة وحفظها بنجاح",
      });
      
      return true;
    } catch (error) {
      console.error("خطأ في معالجة الصورة:", error);
      
      // عرض إشعار فشل
      toast({
        title: "فشل المعالجة",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [coreProcessing.saveProcessedImage, toast]);
  
  return {
    ...coreProcessing,
    formatDate,
    autoExportEnabled,
    defaultSheetId,
    toggleAutoExport,
    setDefaultSheet,
    // تصدير وظائف إضافية إلى الواجهة
    runCleanupNow: coreProcessing.runCleanupNow,
    isDuplicateImage: coreProcessing.isDuplicateImage,
    clearImageCache: coreProcessing.clearImageCache,
    retryProcessing,
    pauseProcessing: coreProcessing.pauseProcessing,
    clearQueue: coreProcessing.clearQueue,
    activeUploads: coreProcessing.activeUploads || 0,
    queueLength: coreProcessing.queueLength || 0,
    useGemini: coreProcessing.useGemini || false,
    saveProcessedImage: saveProcessedImage,
    uploadLimitInfo: coreProcessing.uploadLimitInfo // إضافة معلومات حدود التحميل
  };
};

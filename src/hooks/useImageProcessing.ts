
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";
import { DEFAULT_GEMINI_API_KEY, resetAllApiKeys } from "@/lib/gemini/apiKeyManager";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";

// تتبع عدد المحاولات الإجمالية للجلسة
let sessionRetryAttempts = 0;
const MAX_SESSION_RETRIES = 5;

// سجل عام للأخطاء
let processingErrorsCount = 0;
const MAX_PROCESSING_ERRORS = 3;

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
    
    // إعادة تعيين عدد محاولات الجلسة وعداد الأخطاء عند بدء التطبيق
    sessionRetryAttempts = 0;
    processingErrorsCount = 0;
    
    // محاولة معالجة الصور العالقة في حالة "قيد الانتظار" مع حد للمحاولات
    if (coreProcessing.images && coreProcessing.images.length > 0) {
      const pendingImages = coreProcessing.images.filter(img => img.status === "pending" || img.status === "processing");
      
      if (pendingImages.length > 0 && sessionRetryAttempts < MAX_SESSION_RETRIES) {
        console.log(`تم العثور على ${pendingImages.length} صورة في انتظار المعالجة، سيتم محاولة إعادة معالجتها...`);
        
        // محاولة إعادة التشغيل تلقائيًا بعد قليل
        setTimeout(() => {
          if (coreProcessing.retryProcessing) {
            sessionRetryAttempts++;
            const success = coreProcessing.retryProcessing();
            
            if (success) {
              toast({
                title: "إعادة المعالجة",
                description: `تم العثور على ${pendingImages.length} صورة في انتظار المعالجة، وتمت محاولة إعادة معالجتها تلقائيًا`,
              });
            }
          }
        }, 5000); // انتظار 5 ثوانٍ قبل محاولة المعالجة
      }
    }
    
    // التحقق من وجود أي أخطاء في الصور السابقة وإعدادها لإعادة المعالجة
    const errorImages = coreProcessing.images.filter(img => img.status === "error");
    if (errorImages.length > 0) {
      // تسجيل عدد الأخطاء في المحاولات السابقة
      localStorage.setItem('gemini_processing_errors', String(errorImages.length));
      console.log(`تم العثور على ${errorImages.length} صورة بحالة خطأ، تم تسجيلها لتنبيه المستخدم`);
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
  
  // تحسين وظيفة إعادة تشغيل المعالجة مع منع الحلقة التكرارية
  const retryProcessing = useCallback(() => {
    // زيادة عدد المحاولات في الجلسة
    sessionRetryAttempts++;
    
    // إيقاف المحاولات إذا تجاوزت الحد الأقصى
    if (sessionRetryAttempts > MAX_SESSION_RETRIES) {
      console.log(`تجاوز الحد الأقصى للمحاولات في الجلسة (${MAX_SESSION_RETRIES})`);
      toast({
        title: "تنبيه",
        description: "تم تجاوز الحد الأقصى للمحاولات. يرجى إعادة تحميل الصفحة.",
        variant: "destructive"
      });
      return false;
    }
    
    // إعادة تعيين جميع مفاتيح API قبل إعادة التشغيل
    resetAllApiKeys();
    console.log("تم إعادة تعيين جميع مفاتيح API قبل إعادة المحاولة (المحاولة رقم " + sessionRetryAttempts + ")");
    
    if (coreProcessing.retryProcessing) {
      console.log("إعادة تشغيل عملية معالجة الصور...");
      const success = coreProcessing.retryProcessing();
      
      if (success) {
        // عرض إشعار للمستخدم
        toast({
          title: "إعادة تشغيل",
          description: "تم إعادة تشغيل المعالجة للصور في قائمة الانتظار",
        });
      }
      
      return success;
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
      
      // زيادة عداد الأخطاء العام
      processingErrorsCount++;
      
      // إذا تجاوزنا الحد الأقصى من الأخطاء، نخزن ذلك للتنبيه عند إعادة تحميل التطبيق
      if (processingErrorsCount >= MAX_PROCESSING_ERRORS) {
        localStorage.setItem('gemini_processing_errors', String(processingErrorsCount));
      }
      
      // عرض إشعار فشل
      toast({
        title: "فشل المعالجة",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [coreProcessing.saveProcessedImage, toast]);
  
  // وظيفة إعادة تعيين المتغيرات العامة
  const resetGlobalState = useCallback(() => {
    sessionRetryAttempts = 0;
    processingErrorsCount = 0;
    
    // مسح سجل الأخطاء في التخزين المحلي
    localStorage.removeItem('gemini_processing_errors');
    
    console.log("تم إعادة تعيين متغيرات الحالة العامة");
    
    // إعادة استدعاء وظيفة إعادة التعيين في الكائن الأساسي
    if (coreProcessing.resetProcessingState) {
      return coreProcessing.resetProcessingState();
    }
  }, [coreProcessing.resetProcessingState]);
  
  // الحصول على معلومات حدود التحميل من useFileUpload في coreProcessing
  const uploadLimitInfo = coreProcessing.uploadLimitInfo || {
    subscription: 'standard',
    dailyLimit: 3,
    currentCount: 0,
    remainingUploads: 3
  };
  
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
    saveProcessedImage,
    uploadLimitInfo, // إضافة معلومات حدود التحميل للواجهة
    resetProcessingState: resetGlobalState // استخدام الوظيفة المحسنة
  };
};

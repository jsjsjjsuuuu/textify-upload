
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";
import { DEFAULT_GEMINI_API_KEY, resetAllApiKeys } from "@/lib/gemini/apiKeyManager";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();

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
  }, []);
  
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
      
      return true;
    }
    return false;
  }, [coreProcessing.retryProcessing]);
  
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
    pauseProcessing: coreProcessing.pauseProcessing, // تصدير وظيفة الإيقاف المؤقت
    clearQueue: coreProcessing.clearQueue, // تصدير وظيفة مسح القائمة
    activeUploads: coreProcessing.activeUploads || 0,
    queueLength: coreProcessing.queueLength || 0,
    useGemini: coreProcessing.useGemini || false,
    saveProcessedImage: coreProcessing.saveProcessedImage || (async () => {})
  };
};

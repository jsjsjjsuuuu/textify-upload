
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();

  // يجب أن تكون جميع hooks مستدعاة في كل مرة يتم فيها استدعاء الـ hook بنفس الترتيب
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem('autoExportEnabled') === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem('defaultSheetId') || ''
  );
  
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
    if (coreProcessing.retryProcessing) {
      coreProcessing.retryProcessing();
    }
  }, [coreProcessing]);
  
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
    activeUploads: coreProcessing.activeUploads || 0,
    queueLength: coreProcessing.queueLength || 0,
    useGemini: coreProcessing.useGemini || false // إضافة خاصية useGemini
  };
};

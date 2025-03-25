
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect } from "react";

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
  
  return {
    ...coreProcessing,
    formatDate,
    autoExportEnabled,
    defaultSheetId,
    toggleAutoExport,
    setDefaultSheet
  };
};

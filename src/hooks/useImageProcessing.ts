
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();

  // يجب أن تكون جميع hooks مستدعاة في كل مرة يتم فيها استدعاء الـ hook بنفس الترتيب
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem('autoExportEnabled') === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem('defaultSheetId') || ''
  );
  
  // إضافة حالة لتتبع ما إذا كان المستخدم طلب تحديث البيانات يدويًا
  const [userRequestedRefresh, setUserRequestedRefresh] = useState(false);
  
  // إضافة حالة لتتبع ما إذا كان المستخدم طلب تنظيف التكرار يدويًا
  const [userRequestedCleanup, setUserRequestedCleanup] = useState(false);
  
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
  
  // إضافة تأثير لتحديث البيانات عندما يطلب المستخدم ذلك
  useEffect(() => {
    if (userRequestedRefresh) {
      const refreshData = async () => {
        try {
          await coreProcessing.refreshUserData();
          toast.success("تم تحديث بياناتك بنجاح!");
        } catch (error) {
          console.error("فشل تحديث البيانات:", error);
          toast.error("حدث خطأ أثناء تحديث البيانات");
        } finally {
          setUserRequestedRefresh(false);
        }
      };
      
      refreshData();
    }
  }, [userRequestedRefresh, coreProcessing]);
  
  // إضافة تأثير لتنظيف التكرار عندما يطلب المستخدم ذلك
  useEffect(() => {
    if (userRequestedCleanup) {
      const cleanup = () => {
        try {
          const duplicatesRemoved = coreProcessing.removeDuplicates();
          
          if (duplicatesRemoved) {
            toast.success("تم إزالة السجلات المكررة بنجاح");
            // إعادة ترقيم الصور بعد التنظيف
            coreProcessing.renumberImages();
          } else {
            toast.info("لا توجد سجلات مكررة لإزالتها");
          }
        } catch (error) {
          console.error("فشل تنظيف البيانات:", error);
          toast.error("حدث خطأ أثناء تنظيف البيانات");
        } finally {
          setUserRequestedCleanup(false);
        }
      };
      
      cleanup();
    }
  }, [userRequestedCleanup, coreProcessing]);
  
  // تفعيل/تعطيل التصدير التلقائي
  const toggleAutoExport = (value: boolean) => {
    setAutoExportEnabled(value);
  };
  
  // تعيين جدول البيانات الافتراضي
  const setDefaultSheet = (sheetId: string) => {
    setDefaultSheetId(sheetId);
  };
  
  // وظيفة لتحديث البيانات يدويًا
  const refreshUserImages = () => {
    if (coreProcessing.isLoading) {
      toast.info("جاري تحميل البيانات بالفعل، يرجى الانتظار...");
      return;
    }
    
    console.log("طلب تحديث البيانات من المستخدم");
    setUserRequestedRefresh(true);
  };
  
  // إزالة التكرار بشكل يدوي
  const cleanupDuplicates = () => {
    if (coreProcessing.isLoading) {
      toast.info("جاري تحميل البيانات بالفعل، يرجى الانتظار...");
      return;
    }
    
    console.log("طلب تنظيف البيانات المكررة من المستخدم");
    setUserRequestedCleanup(true);
  };
  
  return {
    ...coreProcessing,
    formatDate,
    autoExportEnabled,
    defaultSheetId,
    toggleAutoExport,
    setDefaultSheet,
    refreshUserImages,
    cleanupDuplicates
  };
};

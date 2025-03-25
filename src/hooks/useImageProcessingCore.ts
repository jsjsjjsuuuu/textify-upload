
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { AUTO_EXPORT_CONFIG } from "@/lib/googleSheets/config";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoExportEnabled, setAutoExportEnabled] = useState(AUTO_EXPORT_CONFIG.ENABLED);
  const [defaultSheetId, setDefaultSheetId] = useState<string | null>(
    localStorage.getItem("defaultGoogleSheetId")
  );
  
  const { toast } = useToast();
  
  const { 
    images, 
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange 
  } = useImageState();
  
  const { 
    isProcessing, 
    useGemini, 
    handleFileChange 
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress
  });
  
  const { 
    isInitialized,
    isSignedIn, // الآن هذه الخاصية متاحة
    isLoading,
    spreadsheets,
    handleSignIn, // الآن هذه الخاصية متاحة
    createSheet,
    exportToSheet
  } = useGoogleSheets();
  
  // تحقق من وجود معرف جدول بيانات افتراضي وإنشاء واحد إذا لم يكن موجوداً
  useEffect(() => {
    if (autoExportEnabled && isSignedIn && !isLoading) {
      const checkDefaultSheet = async () => {
        // التحقق من وجود معرف جدول بيانات افتراضي
        if (!defaultSheetId && AUTO_EXPORT_CONFIG.AUTO_CREATE_IF_MISSING) {
          try {
            console.log("إنشاء جدول بيانات افتراضي جديد...");
            const newSheetId = await createSheet(AUTO_EXPORT_CONFIG.DEFAULT_SHEET_NAME);
            if (newSheetId) {
              setDefaultSheetId(newSheetId);
              localStorage.setItem("defaultGoogleSheetId", newSheetId);
              toast({
                title: "تم إنشاء جدول بيانات افتراضي",
                description: `تم إنشاء جدول بيانات افتراضي بنجاح: ${AUTO_EXPORT_CONFIG.DEFAULT_SHEET_NAME}`,
              });
            }
          } catch (error) {
            console.error("فشل في إنشاء جدول بيانات افتراضي:", error);
          }
        } else if (defaultSheetId) {
          console.log("تم العثور على جدول بيانات افتراضي:", defaultSheetId);
        }
      };
      
      checkDefaultSheet();
    }
  }, [isSignedIn, isLoading, defaultSheetId, autoExportEnabled]);

  // وظيفة التصدير التلقائي إلى Google Sheets
  const autoExportToSheets = async (completedImage: ImageData) => {
    if (!autoExportEnabled || !isSignedIn || !defaultSheetId) {
      return false;
    }
    
    try {
      console.log("تصدير تلقائي للبيانات إلى Google Sheets...");
      const success = await exportToSheet(defaultSheetId, [completedImage]);
      if (success) {
        toast({
          title: "تم التصدير التلقائي",
          description: "تم تصدير البيانات تلقائياً إلى Google Sheets",
        });
        return true;
      }
    } catch (error) {
      console.error("فشل في التصدير التلقائي إلى Google Sheets:", error);
    }
    
    return false;
  };

  // وظيفة إرسال البيانات إلى API (محاكاة)
  const handleSubmitToApi = async (id: string, image: ImageData) => {
    setIsSubmitting(true);
    try {
      // محاكاة طلب API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("تم إرسال البيانات:", {
        id: id,
        code: image.code,
        senderName: image.senderName,
        phoneNumber: image.phoneNumber,
        province: image.province,
        price: image.price,
        companyName: image.companyName
      });

      // تحديث حالة الصورة
      updateImage(id, { status: "completed" });
      
      toast({
        title: "نجاح",
        description: `تم معالجة البيانات بنجاح لـ ${image.file.name}!`,
      });
      
      // تصدير تلقائي إلى Google Sheets إذا كانت الميزة مفعلة وتم تسجيل الدخول
      if (autoExportEnabled && isSignedIn && defaultSheetId) {
        // هنا كانت المشكلة - تم تعديل صياغة الحالة في الكائن المحدّث لتكون قيمة محددة وليست نصاً عاماً
        const updatedImage: ImageData = { 
          ...image, 
          status: "completed" 
        };
        await autoExportToSheets(updatedImage);
      }
    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      updateImage(id, { status: "error" });
      
      toast({
        title: "خطأ",
        description: `فشل معالجة البيانات لـ ${image.file.name}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // وظيفة تبديل تفعيل/تعطيل التصدير التلقائي
  const toggleAutoExport = (enabled: boolean) => {
    setAutoExportEnabled(enabled);
    if (enabled && !isSignedIn) {
      // محاولة تسجيل الدخول تلقائياً إذا تم تفعيل التصدير التلقائي
      handleSignIn();
    }
  };
  
  // وظيفة تعيين جدول البيانات الافتراضي
  const setDefaultSheet = (sheetId: string) => {
    setDefaultSheetId(sheetId);
    localStorage.setItem("defaultGoogleSheetId", sheetId);
    toast({
      title: "تم تعيين الجدول الافتراضي",
      description: "تم تعيين جدول البيانات الافتراضي بنجاح"
    });
  };

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    autoExportEnabled,
    defaultSheetId,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    toggleAutoExport,
    setDefaultSheet
  };
};


import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSubmission } from "@/hooks/useSubmission";
import { saveToLocalStorage, getStorageStats } from "@/utils/bookmarklet";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
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
    isSubmitting, 
    handleSubmitToApi 
  } = useSubmission(updateImage);

  // حفظ البيانات المكتملة في localStorage وتحديث الإحصائيات
  useEffect(() => {
    // استخراج الصور المكتملة فقط
    const completedImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
    // حفظ البيانات فقط إذا كان هناك صور مكتملة
    if (completedImages.length > 0) {
      console.log("حفظ البيانات المكتملة في localStorage:", completedImages.length, "صورة");
      saveToLocalStorage(completedImages);
      
      // تحديث الإحصائيات بعد الحفظ
      updateBookmarkletStats();
    }
  }, [images]);
  
  // تحديث إحصائيات البوكماركلت بشكل دوري
  useEffect(() => {
    // تحديث الإحصائيات عند التحميل الأولي
    updateBookmarkletStats();
    
    // إعداد مؤقت لتحديث الإحصائيات كل دقيقة
    const intervalId = setInterval(updateBookmarkletStats, 60000);
    
    // تنظيف المؤقت عند إزالة المكون
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // وظيفة تحديث إحصائيات البوكماركلت
  const updateBookmarkletStats = () => {
    try {
      const stats = getStorageStats();
      setBookmarkletStats({
        total: stats.total || 0,
        ready: stats.ready || 0,
        success: stats.success || 0,
        error: stats.error || 0
      });
    } catch (e) {
      console.error("خطأ في تحديث إحصائيات البوكماركلت:", e);
    }
  };

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    updateBookmarkletStats
  };
};


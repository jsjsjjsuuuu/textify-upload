
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { saveToLocalStorage, getStorageStats } from "@/utils/bookmarklet";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // وظيفة إرسال البيانات إلى API
  const handleSubmitToApi = async (id: string, image: ImageData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          extractedText: image.extractedText,
          extractedData: image.extractedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      updateImage(id, { status: "success" });
      
      toast({
        title: "نجاح",
        description: `تم إرسال البيانات بنجاح لـ ${image.originalFilename}!`,
      });
      
      await updateBookmarkletStats();
    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      updateImage(id, { status: "error" });
      
      toast({
        title: "خطأ",
        description: `فشل إرسال البيانات لـ ${image.originalFilename}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

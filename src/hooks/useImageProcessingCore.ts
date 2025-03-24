
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";

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
    handleSubmitToApi
  };
};

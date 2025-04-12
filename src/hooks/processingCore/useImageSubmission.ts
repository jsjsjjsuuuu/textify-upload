
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";

interface ImageSubmissionProps {
  images: ImageData[];
  updateImage: (id: string, updatedFields: Partial<ImageData>) => void;
  hideImage: (id: string) => boolean;
  submitToApi: (id: string, image: ImageData, userId?: string) => Promise<boolean>;
  validateRequiredFields: (image: ImageData) => boolean;
  markImageAsProcessed?: (image: ImageData) => void;
}

export const useImageSubmission = ({
  images,
  updateImage,
  hideImage,
  submitToApi,
  validateRequiredFields,
  markImageAsProcessed
}: ImageSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // إعادة هيكلة وظيفة handleSubmitToApi لتستخدم وظيفة إخفاء الصورة بعد الإرسال
  const handleSubmitToApi = useCallback(async (id: string, userId?: string) => {
    // العثور على الصورة حسب المعرف
    const image = images.find(img => img.id === id);
    
    if (!image) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الصورة المحددة",
        variant: "destructive"
      });
      return false;
    }
    
    // التحقق من اكتمال البيانات قبل الإرسال
    if (!validateRequiredFields(image)) {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      console.log("جاري إرسال البيانات للصورة:", id);
      // محاولة إرسال البيانات إلى API وحفظها في قاعدة البيانات
      const success = await submitToApi(id, image, userId);
      
      if (success) {
        console.log("تم إرسال البيانات بنجاح للصورة:", id);
        
        // تحديث الصورة محلياً
        updateImage(id, { submitted: true, status: "completed" });
        
        // تسجيل الصورة كمعالجة لتجنب إعادة المعالجة إذا كانت الدالة متاحة
        if (markImageAsProcessed && image) {
          markImageAsProcessed(image);
        }
        
        toast({
          title: "تم الإرسال",
          description: "تم إرسال البيانات وحفظها بنجاح",
        });
        
        // تأكد من وجود وظيفة hideImage قبل استدعائها
        console.log("جاري إخفاء الصورة بعد الإرسال الناجح:", id);
        hideImage(id);
        
        return true;
      } else {
        console.error("فشل في إرسال البيانات للصورة:", id);
        return false;
      }
    } catch (error) {
      console.error("خطأ في إرسال البيانات:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء محاولة إرسال البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [images, updateImage, submitToApi, toast, validateRequiredFields, hideImage, markImageAsProcessed]);

  return {
    isSubmitting,
    handleSubmitToApi
  };
};

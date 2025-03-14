
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { submitTextToApi } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

export const useSubmission = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitToApi = async (id: string, image: ImageData) => {
    if (!image || image.status !== "completed") {
      toast({
        title: "خطأ في الإرسال",
        description: "يرجى التأكد من اكتمال معالجة الصورة واستخراج النص",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من صحة البيانات قبل الإرسال
    let hasErrors = false;
    let errorMessages = [];
    
    // التحقق من رقم الهاتف
    if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      hasErrors = true;
      errorMessages.push("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)");
    }
    
    // التحقق من السعر
    if (image.price) {
      const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
      const numValue = parseFloat(cleanedPrice);
      if (numValue > 0 && numValue < 1000 && image.price !== '0') {
        hasErrors = true;
        errorMessages.push("السعر غير صحيح (يجب أن يكون 1000 أو أكبر أو 0)");
      }
    }
    
    if (hasErrors) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: errorMessages.join("، "),
        variant: "destructive"
      });
      return;
    }
    
    // التأكد من تحديث حالة الصورة إلى "مكتملة" قبل الإرسال
    if (image.code && image.senderName && image.phoneNumber && image.status !== "completed") {
      updateImage(id, { status: "completed" });
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString()
      });
      
      if (result.success) {
        updateImage(id, { submitted: true });

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmitToApi };
};

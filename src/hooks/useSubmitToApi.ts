
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { submitTextToApi } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

export const useSubmitToApi = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
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
    
    // التأكد من صحة رقم الهاتف إذا كان موجودًا
    if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "رقم الهاتف غير صالح، يجب أن يتكون من 11 رقم",
        variant: "destructive"
      });
      return;
    }
    
    // إذا كانت الصورة قد تم إرسالها مسبقًا
    if (image.submitted) {
      toast({
        title: "تم الإرسال مسبقًا",
        description: "تم إرسال هذه البيانات مسبقًا",
        variant: "default"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString(),
        // إضافة بيانات إضافية للإرسال
        metadata: {
          senderName: image.senderName || "",
          phoneNumber: image.phoneNumber || "",
          province: image.province || "",
          price: image.price || "",
          companyName: image.companyName || "",
          code: image.code || ""
        }
      });
      
      if (result.success) {
        updateImage(id, { submitted: true });

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message
        });
        
        return true;
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error) {
      console.error("خطأ في إرسال البيانات:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmitToApi };
};

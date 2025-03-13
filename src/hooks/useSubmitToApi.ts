
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { submitImageToExternalApi } from "@/lib/supabaseService";
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
    
    setIsSubmitting(true);
    try {
      console.log("جاري إرسال البيانات للصورة:", id);
      // استخدام وظيفة Supabase للإرسال
      const result = await submitImageToExternalApi(id);
      
      if (result.success) {
        updateImage(id, { submitted: true });

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message || "تم إرسال البيانات إلى النظام"
        });
        console.log("تم الإرسال بنجاح:", result.message);
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.error || "حدث خطأ غير معروف أثناء الإرسال",
          variant: "destructive"
        });
        console.error("فشل في الإرسال:", result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("استثناء أثناء الإرسال:", errorMessage);
      
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

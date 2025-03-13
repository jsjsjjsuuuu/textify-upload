
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { submitImageToExternalApi } from "@/lib/supabaseService";
import { useToast } from "@/hooks/use-toast";

export const useSubmitToApi = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const resetRetryCount = useCallback((id: string) => {
    setRetryCount(prev => {
      const newCounts = { ...prev };
      delete newCounts[id];
      return newCounts;
    });
  }, []);

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
        // إعادة ضبط عداد المحاولات عند النجاح
        resetRetryCount(id);

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message || "تم إرسال البيانات إلى النظام",
          variant: "default"
        });
        console.log("تم الإرسال بنجاح:", result.message);
      } else {
        // زيادة عداد المحاولات
        const currentRetryCount = retryCount[id] || 0;
        const newRetryCount = currentRetryCount + 1;
        setRetryCount(prev => ({ ...prev, [id]: newRetryCount }));

        // رسالة خطأ مع إضافة معلومات المحاولة
        toast({
          title: "فشل في الإرسال",
          description: `${result.error || "حدث خطأ غير معروف أثناء الإرسال"} (محاولة ${newRetryCount})`,
          variant: "destructive"
        });
        console.error("فشل في الإرسال:", result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("استثناء أثناء الإرسال:", errorMessage);
      
      // زيادة عداد المحاولات للاستثناءات أيضًا
      const currentRetryCount = retryCount[id] || 0;
      const newRetryCount = currentRetryCount + 1;
      setRetryCount(prev => ({ ...prev, [id]: newRetryCount }));

      toast({
        title: "خطأ في الإرسال",
        description: `حدث خطأ أثناء الاتصال بالخادم (محاولة ${newRetryCount})`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // إعادة المحاولة مع وظيفة منفصلة
  const handleRetrySubmit = (id: string, image: ImageData) => {
    console.log("إعادة محاولة الإرسال للصورة:", id);
    handleSubmitToApi(id, image);
  };

  return { 
    isSubmitting, 
    handleSubmitToApi,
    handleRetrySubmit,
    retryCount 
  };
};

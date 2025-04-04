
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useSubmitSystem = (
  images: ImageData[],
  updateImage: (id: string, fields: Partial<ImageData>) => void,
  saveImageToDatabase: (image: ImageData, userId: string | undefined) => Promise<any>,
  validateRequiredFields: (image: ImageData) => boolean
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // وظيفة إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, user?: any) => {
    // العثور على الصورة حسب المعرف
    const image = images.find(img => img.id === id);
    
    if (!image) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الصورة المحددة",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من اكتمال البيانات قبل الإرسال
    if (!validateRequiredFields(image)) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // إعداد البيانات للإرسال
      const extractedData = {
        company_name: image.companyName || "",
        sender_name: image.senderName || "",
        phone_number: image.phoneNumber || "",
        code: image.code || "",
        price: image.price || "",
        province: image.province || ""
      };
      
      console.log("جاري إرسال البيانات إلى API...", extractedData);
      
      try {
        // إرسال البيانات إلى ويب هوك n8n
        const response = await fetch("https://ahmed0770.app.n8n.cloud/webhook-test/a9ee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractedData)
        });
        
        if (!response.ok) {
          throw new Error(`حدث خطأ أثناء الاستجابة: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("تم إرسال البيانات بنجاح:", data);

        // حفظ البيانات في قاعدة البيانات Supabase
        const savedData = await saveImageToDatabase(image, user?.id);
        
        toast({
          title: "نجاح",
          description: `تم إرسال البيانات بنجاح!`,
        });
        
        // تحديث الصورة محلياً
        updateImage(id, { submitted: true, status: "completed" });
        return true;
      } catch (apiError: any) {
        console.error("خطأ في اتصال API:", apiError);
        
        // نحاول حفظ البيانات في قاعدة البيانات على أي حال
        console.log("محاولة حفظ البيانات في قاعدة البيانات على الرغم من فشل API...");
        const savedData = await saveImageToDatabase(image, user?.id);
        
        if (savedData) {
          toast({
            title: "تم الحفظ",
            description: `تم حفظ البيانات في قاعدة البيانات، ولكن فشل إرسال البيانات إلى API: ${apiError.message}`,
            variant: "default"
          });
          
          // تحديث الصورة محلياً
          updateImage(id, { submitted: true, status: "completed" });
          return true;
        } else {
          throw new Error(`فشل إرسال البيانات إلى API والحفظ في قاعدة البيانات: ${apiError.message}`);
        }
      }
    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      
      toast({
        title: "خطأ",
        description: `فشل إرسال البيانات: ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmitToApi
  };
};

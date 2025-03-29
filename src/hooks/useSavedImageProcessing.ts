
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useImageDatabase } from "./useImageDatabase";

export const useSavedImageProcessing = (
  updateImage: (id: string, fields: Partial<ImageData>) => void, 
  setAllImages: (images: ImageData[]) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { saveImageToDatabase, loadUserImages } = useImageDatabase(updateImage);
  
  // وظيفة حفظ الصورة المعالجة عند النقر على زر الإرسال
  const saveProcessedImage = async (image: ImageData) => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      return;
    }

    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    if (image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة في قاعدة البيانات بواسطة زر الإرسال:", image.id);
      
      try {
        setIsSubmitting(true);
        // حفظ البيانات في قاعدة البيانات
        const savedData = await saveImageToDatabase(image, user.id);
        
        if (savedData) {
          // تحديث الصورة بمعلومات أنها تم حفظها والبيانات المحدثة من قاعدة البيانات
          updateImage(image.id, { 
            submitted: true,
            code: savedData.code || image.code,
            senderName: savedData.sender_name || image.senderName,
            phoneNumber: savedData.phone_number || image.phoneNumber,
            province: savedData.province || image.province,
            price: savedData.price || image.price,
            companyName: savedData.company_name || image.companyName,
            extractedText: savedData.extracted_text || image.extractedText
          });
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          await loadUserImages(user.id, setAllImages);
          
          toast({
            title: "تم الحفظ",
            description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
          });
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء محاولة حفظ البيانات",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة أولاً",
        variant: "destructive"
      });
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage
  };
};

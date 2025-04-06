
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
  
  // وظيفة حفظ الصورة المعالجة عند النقر على زر الإرسال - تحسين التعامل مع الأخطاء
  const saveProcessedImage = async (image: ImageData): Promise<void> => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      return;
    }

    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    if (image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة في قاعدة البيانات بواسطة زر الإرسال:", image.id);
      
      try {
        setIsSubmitting(true);
        // حفظ البيانات في قاعدة البيانات - تمرير الصورة فقط
        const savedData = await saveImageToDatabase(image);
        
        if (savedData) {
          // تحديث الصورة بمعلومات أنها تم حفظها
          updateImage(image.id, { 
            submitted: true,
            // نضيف أيضًا تحديث حالة الصورة إلى مكتملة
            status: "completed"
          });
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          if (user) {
            await loadUserImages(user.id, setAllImages);
          }
          
          toast({
            title: "تم الحفظ",
            description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
          });
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
        
        // تحديث حالة الصورة لتعكس أنها لم يتم حفظها بنجاح
        updateImage(image.id, { 
          error: "حدث خطأ أثناء محاولة حفظ البيانات"
        });
        
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء محاولة حفظ البيانات",
          variant: "destructive"
        });
        
        // إعادة إلقاء الخطأ للتعامل معه في المستدعي
        throw new Error("حدث خطأ أثناء محاولة حفظ البيانات");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
      
      // تحديث حالة الصورة لتعكس أن البيانات غير مكتملة
      updateImage(image.id, { 
        error: "البيانات غير مكتملة"
      });
      
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة أولاً",
        variant: "destructive"
      });
      
      // إلقاء خطأ ليتم التعامل معه في المستدعي
      throw new Error("يرجى ملء جميع الحقول المطلوبة أولاً");
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage
  };
};

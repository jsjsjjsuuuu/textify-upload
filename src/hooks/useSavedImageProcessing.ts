
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
  
  // وظيفة حفظ الصورة المعالجة
  const saveProcessedImage = async (image: ImageData) => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      return;
    }

    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    if (image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة المعالجة في قاعدة البيانات:", image.id);
      
      try {
        // حفظ البيانات في قاعدة البيانات
        const savedData = await saveImageToDatabase(image, user.id);
        
        if (savedData) {
          // تحديث الصورة بمعلومات أنها تم حفظها
          updateImage(image.id, { submitted: true });
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          await loadUserImages(user.id, setAllImages);
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage
  };
};

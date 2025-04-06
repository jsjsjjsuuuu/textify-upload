
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useImageDatabase } from "./useImageDatabase";
import { createImageHash } from "@/utils/duplicateDetection";

export const useSavedImageProcessing = (
  updateImage: (id: string, fields: Partial<ImageData>) => void, 
  setAllImages: (images: ImageData[]) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processedImageIds] = useState(new Set<string>()); // مجموعة لتخزين معرّفات الصور المعالجة
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { saveImageToDatabase, loadUserImages } = useImageDatabase(updateImage);
  
  // وظيفة حفظ الصورة المعالجة مع تجنب التكرار
  const saveProcessedImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // التحقق من أن الصورة غير معالجة بالفعل
      if (processedImageIds.has(image.id)) {
        console.log(`الصورة ${image.id} تمت معالجتها بالفعل، تخطي المعالجة المتكررة`);
        return image;
      }
      
      // التحقق من الحالة الحالية للصورة وتخطي المعالجة إذا كانت مكتملة أو بها خطأ
      if (image.status === "completed" || image.status === "error") {
        console.log(`تخطي معالجة الصورة ${image.id} لأنها بالفعل في حالة ${image.status}`);
        return image;
      }
      
      // تحديث الحالة إلى "جاري المعالجة"
      updateImage(image.id, { status: "processing" });
      
      if (!user) {
        console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
        return image;
      }
      
      // إضافة معرف الصورة إلى المجموعة لتجنب المعالجة المتكررة
      processedImageIds.add(image.id);
      
      // التحقق من أن الصورة تحتوي على البيانات الأساسية
      const hasBasicData = image.code && image.senderName && image.phoneNumber;
      
      if (hasBasicData) {
        console.log("حفظ الصورة في قاعدة البيانات:", image.id);
        
        setIsSubmitting(true);
        // حفظ البيانات في قاعدة البيانات - تمرير الصورة فقط
        const savedData = await saveImageToDatabase(image);
        
        if (savedData) {
          // تحديث الصورة بمعلومات أنها تم حفظها
          const updatedImage = { 
            ...image, 
            submitted: true,
            status: "completed" as const
          };
          
          updateImage(image.id, { submitted: true, status: "completed" });
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          await loadUserImages(user.id, setAllImages);
          
          toast({
            title: "تم الحفظ",
            description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
          });
          
          return updatedImage;
        }
      } else {
        // تحديث الصورة لتكون مكتملة ولكن غير مرسلة
        const updatedImage = {
          ...image,
          status: "completed" as const
        };
        
        updateImage(image.id, { status: "completed" });
        console.log("تم الانتهاء من معالجة الصورة:", image.id);
        
        return updatedImage;
      }
      
      return image;
    } catch (error) {
      console.error("خطأ أثناء حفظ الصورة:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء محاولة حفظ البيانات",
        variant: "destructive"
      });
      
      // تحديث الصورة لتكون في حالة خطأ
      const errorImage = {
        ...image,
        status: "error" as const,
        error: "فشل في حفظ الصورة"
      };
      
      updateImage(image.id, { status: "error", error: "فشل في حفظ الصورة" });
      return errorImage;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage
  };
};

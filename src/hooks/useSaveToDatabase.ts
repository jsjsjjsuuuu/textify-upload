
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ImageData } from "@/types/ImageData";
import { imageDataToRecord, saveExtractedRecord } from "@/lib/supabase";

export const useSaveToDatabase = () => {
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [savedImages, setSavedImages] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const saveImageToDatabase = async (image: ImageData) => {
    if (!user) {
      toast({
        title: "خطأ في الحفظ",
        description: "يجب تسجيل الدخول لحفظ البيانات",
        variant: "destructive"
      });
      return false;
    }

    if (!image.extractedText) {
      toast({
        title: "خطأ في الحفظ",
        description: "لا يوجد نص مستخرج لحفظه",
        variant: "destructive"
      });
      return false;
    }

    setIsSaving(prev => ({ ...prev, [image.id]: true }));

    try {
      // تحويل البيانات إلى تنسيق سجل قاعدة البيانات
      const record = imageDataToRecord(image, user.id);
      
      // حفظ السجل والصورة
      const result = await saveExtractedRecord(record, image.file);

      if (result.success) {
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ البيانات المستخرجة في قاعدة البيانات",
        });
        
        setSavedImages(prev => ({ ...prev, [image.id]: true }));
        return true;
      } else {
        toast({
          title: "فشل في الحفظ",
          description: "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("خطأ أثناء حفظ البيانات:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ غير متوقع أثناء حفظ البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(prev => ({ ...prev, [image.id]: false }));
    }
  };

  return {
    saveImageToDatabase,
    isSaving,
    savedImages
  };
};

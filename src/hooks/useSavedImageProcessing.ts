import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface UseSavedImageProcessingProps {
  updateImage: (id: string, data: Partial<ImageData>) => void;
  setAllImages: (images: ImageData[]) => void;
}

export const useSavedImageProcessing = (
  updateImage: UseSavedImageProcessingProps["updateImage"],
  setAllImages: UseSavedImageProcessingProps["setAllImages"]
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // إضافة خصائص جديدة لتتوافق مع الكود الذي يتوقع isSubmitting و setIsSubmitting
  const isSubmitting = isSaving;
  const setIsSubmitting = setIsSaving;

  const saveProcessedImage = async (image: ImageData): Promise<boolean> => {
    try {
      setIsSaving(true);
      
      if (!image || !image.id) {
        console.error("بيانات الصورة غير صالحة");
        return false;
      }

      console.log("حفظ صورة معالجة:", image.id);
      
      // إعداد البيانات للإدراج
      const imageData = {
        id: image.id,
        user_id: image.userId,
        status: image.status || 'completed',
        extracted_text: image.extractedText || '',
        storage_path: image.storage_path || '',
        preview_url: image.previewUrl || '',
        batch_id: image.batch_id || 'default',
        code: image.code || '',
        sender_name: image.senderName || '',
        phone_number: image.phoneNumber || '',
        province: image.province || '',
        price: image.price || '',
        company_name: image.companyName || '',
        submitted: image.submitted || false,
        file_name: image.fileName || (image.file ? image.file.name : 'unknown')
      };
      
      // التحقق من وجود الصورة في قاعدة البيانات
      const { data: existingData } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .single();
      
      let result;
      if (existingData) {
        // تحديث الصورة الموجودة
        const { data, error } = await supabase
          .from('images')
          .update(imageData)
          .eq('id', image.id)
          .select();
        
        if (error) throw error;
        result = data;
        console.log("تم تحديث الصورة في قاعدة البيانات:", image.id);
      } else {
        // إنشاء صورة جديدة
        const { data, error } = await supabase
          .from('images')
          .insert(imageData)
          .select();
        
        if (error) throw error;
        result = data;
        console.log("تم إنشاء صورة جديدة في قاعدة البيانات:", image.id);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving processed image:", error);
      toast({
        title: "فشل في حفظ الصورة",
        description: "حدث خطأ أثناء محاولة حفظ الصورة المعالجة",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveProcessedImage,
    // إضافة الخصائص الجديدة
    isSubmitting,
    setIsSubmitting
  };
};

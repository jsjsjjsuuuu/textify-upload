
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { useDbSave } from "./database/useDbSave";
import { useDbDelete } from "./database/useDbDelete";
import { useDbLoad } from "./database/useDbLoad";
import { useDbCleanup } from "./database/useDbCleanup";

export const useImageDatabase = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const { toast } = useToast();
  
  const { saveImageToDatabase } = useDbSave(updateImage);
  const { deleteImageFromDatabase } = useDbDelete();
  const { loadUserImages, isLoadingUserImages } = useDbLoad();
  const { cleanupOldRecords, runCleanupNow } = useDbCleanup();

  // وظيفة إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, image: ImageData, userId: string | undefined) => {
    let isSubmitting = true;
    
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
        const savedData = await saveImageToDatabase(image, userId);
        
        toast({
          title: "نجاح",
          description: `تم إرسال البيانات بنجاح!`,
        });
        
        return true;
      } catch (apiError: any) {
        console.error("خطأ في اتصال API:", apiError);
        
        // نحاول حفظ البيانات في قاعدة البيانات على أي حال
        console.log("محاولة حفظ البيانات في قاعدة البيانات على الرغم من فشل API...");
        const savedData = await saveImageToDatabase(image, userId);
        
        if (savedData) {
          toast({
            title: "تم الحفظ",
            description: `تم حفظ البيانات في قاعدة البيانات، ولكن فشل إرسال البيانات إلى API: ${apiError.message}`,
            variant: "default"
          });
          
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
      isSubmitting = false;
    }
  };

  return {
    isLoadingUserImages,
    saveImageToDatabase,
    loadUserImages,
    handleSubmitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  };
};

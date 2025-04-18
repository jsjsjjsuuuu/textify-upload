
import { useState, useCallback } from "react";
import { CustomImageData, GeminiProcessFn, FileImageProcessFn } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useGeminiProcessing = () => {
  const { toast } = useToast();
  const [apiKeyError, setApiKeyError] = useState(false);
  
  // تعريف دالة معالجة Gemini المتوافقة 
  const processWithGemini: GeminiProcessFn = async (image: CustomImageData): Promise<Partial<CustomImageData>> => {
    try {
      console.log("بدء معالجة Gemini للصورة:", image.id);
      
      // محاكاة معالجة الصورة - في التطبيق الحقيقي ستتم هنا عملية استدعاء API Gemini
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // محاكاة النتائج المستخرجة
      return {
        code: "ABC123",
        senderName: "اسم المرسل",
        phoneNumber: "0501234567",
        province: "الرياض",
        price: "300",
        companyName: "شركة التوصيل",
        extractedText: "تفاصيل الطلب رقم ABC123 المرسل من شركة التوصيل",
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في معالجة Gemini:", error);
      
      const isApiKeyError = error instanceof Error && 
        (error.message.includes("API key") || error.message.includes("مفتاح API"));
      
      if (isApiKeyError) {
        setApiKeyError(true);
        toast({
          title: "خطأ في مفتاح API",
          description: "يرجى التحقق من مفتاح API الخاص بك لـ Gemini",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل في استخراج البيانات",
          description: "حدث خطأ أثناء معالجة الصورة بواسطة Gemini",
          variant: "destructive"
        });
      }
      
      return {
        apiKeyError: isApiKeyError,
        error: `خطأ في معالجة Gemini: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };

  // دالة معالجة Gemini متوافقة مع FileImageProcessFn
  const processFileWithGemini: FileImageProcessFn = async (file: File | Blob, image: CustomImageData): Promise<CustomImageData> => {
    try {
      console.log("بدء معالجة Gemini للملف:", file instanceof File ? file.name : "Blob", "للصورة:", image.id);
      
      // محاكاة معالجة الصورة - في التطبيق الحقيقي ستتم هنا عملية استدعاء API Gemini
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // إرجاع نسخة محدثة من الصورة مع البيانات المستخرجة
      return {
        ...image,
        code: "ABC123",
        senderName: "اسم المرسل",
        phoneNumber: "0501234567",
        province: "الرياض",
        price: "300",
        companyName: "شركة التوصيل",
        extractedText: "تفاصيل الطلب رقم ABC123 المرسل من شركة التوصيل",
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في معالجة Gemini للملف:", error);
      
      const isApiKeyError = error instanceof Error && 
        (error.message.includes("API key") || error.message.includes("مفتاح API"));
      
      if (isApiKeyError) {
        setApiKeyError(true);
        toast({
          title: "خطأ في مفتاح API",
          description: "يرجى التحقق من مفتاح API الخاص بك لـ Gemini",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل في استخراج البيانات",
          description: "حدث خطأ أثناء معالجة الصورة بواسطة Gemini",
          variant: "destructive"
        });
      }
      
      return {
        ...image,
        apiKeyError: isApiKeyError,
        status: "error",
        error: `خطأ في معالجة Gemini: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };

  // دالة مساعدة لتحويل الملف إلى Base64
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // استخراج base64 فقط بدون header
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return { 
    processWithGemini,
    processFileWithGemini,
    apiKeyError
  };
};

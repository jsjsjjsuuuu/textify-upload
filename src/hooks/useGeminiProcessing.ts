
import { useState, useCallback } from "react";
import { CustomImageData, GeminiProcessFn, FileImageProcessFn } from "@/types/ImageData";
import { extractDataWithGemini } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

export const useGeminiProcessing = () => {
  const { toast } = useToast();
  const [apiKeyError, setApiKeyError] = useState(false);

  // تعريف دالة معالجة Gemini المتوافقة مع الواجهة GeminiProcessFn
  const processWithGemini: GeminiProcessFn = async (image: CustomImageData): Promise<Partial<CustomImageData>> => {
    try {
      console.log("بدء معالجة Gemini للصورة:", image.id);
      
      // استدعاء خدمة Gemini مع ملف الصورة والنص المستخرج
      const extractedData = await extractDataWithGemini({
        imageBase64: await fileToBase64(image.file),
        apiKey: localStorage.getItem("geminiApiKey") || ""
      });
      
      if (!extractedData.success) {
        throw new Error(extractedData.message);
      }
      
      console.log("بيانات مستخرجة من Gemini:", extractedData.data);
      
      const parsedData = extractedData.data?.parsedData || {};
      
      return {
        ...parsedData,
        extractedText: extractedData.data?.extractedText,
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في معالجة Gemini:", error);
      
      // التحقق مما إذا كان الخطأ متعلقاً بمفتاح API
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

  // إضافة دالة معالجة Gemini متوافقة مع واجهة FileImageProcessFn
  const processFileWithGemini: FileImageProcessFn = async (file: File | Blob, image: CustomImageData): Promise<CustomImageData> => {
    try {
      console.log("بدء معالجة Gemini للملف:", file instanceof File ? file.name : "Blob", "للصورة:", image.id);
      
      // استدعاء خدمة Gemini مع الملف والنص المستخرج
      const extractedData = await extractDataWithGemini({
        imageBase64: await fileToBase64(file),
        apiKey: localStorage.getItem("geminiApiKey") || ""
      });
      
      if (!extractedData.success) {
        throw new Error(extractedData.message);
      }
      
      console.log("بيانات مستخرجة من Gemini:", extractedData.data);
      
      const parsedData = extractedData.data?.parsedData || {};
      
      // إرجاع نسخة محدثة من الصورة مع البيانات المستخرجة
      return {
        ...image,
        ...parsedData,
        extractedText: extractedData.data?.extractedText,
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في معالجة Gemini للملف:", error);
      
      // التحقق مما إذا كان الخطأ متعلقاً بمفتاح API
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

  // إضافة دالة مساعدة لتحويل الملف إلى Base64
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

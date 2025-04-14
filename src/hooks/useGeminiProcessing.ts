
import { useState, useCallback } from "react";
import { CustomImageData, GeminiProcessFn, FileImageProcessFn } from "@/types/ImageData";
import { extractDataWithGemini } from "@/lib/gemini/service";
import { useToast } from "@/hooks/use-toast";

export const useGeminiProcessing = () => {
  const { toast } = useToast();
  const [apiKeyError, setApiKeyError] = useState(false);

  // تعريف دالة معالجة Gemini المتوافقة مع الواجهة GeminiProcessFn
  const processWithGemini: GeminiProcessFn = async (image: CustomImageData): Promise<Partial<CustomImageData>> => {
    try {
      console.log("بدء معالجة Gemini للصورة:", image.id);
      
      // استدعاء خدمة Gemini مع ملف الصورة والنص المستخرج
      const extractedData = await extractDataWithGemini(image.file, image.extractedText || "");
      console.log("بيانات مستخرجة من Gemini:", extractedData);
      
      return {
        ...extractedData,
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
      const extractedData = await extractDataWithGemini(file, image.extractedText || "");
      console.log("بيانات مستخرجة من Gemini:", extractedData);
      
      // إرجاع نسخة محدثة من الصورة مع البيانات المستخرجة
      return {
        ...image,
        ...extractedData,
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

  return { 
    processWithGemini,
    processFileWithGemini,
    apiKeyError
  };
};

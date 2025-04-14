
import { useState } from "react";
import { ImageData, CustomImageData } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useToast } from "@/hooks/use-toast";

export const useOcrProcessing = () => {
  const { toast } = useToast();

  // تعريف دالة معالجة OCR مع توافق واجهة البيانات المعدلة
  const processWithOcr = async (image: CustomImageData): Promise<string> => {
    try {
      console.log("بدء معالجة OCR للصورة:", image.id);
      
      // استدعاء خدمة OCR مع ملف الصورة
      const result = await extractTextFromImage(image.file);
      console.log("نتيجة OCR:", result);
      
      return result.text;
    } catch (ocrError) {
      console.error("خطأ في معالجة OCR:", ocrError);
      
      toast({
        title: "فشل في استخراج النص",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      return "";
    }
  };

  return { processWithOcr };
};

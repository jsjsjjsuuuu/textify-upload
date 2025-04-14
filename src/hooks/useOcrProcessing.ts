
import { useState } from "react";
import { CustomImageData, OcrProcessFn, ImageProcessFn } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useToast } from "@/hooks/use-toast";

export const useOcrProcessing = () => {
  const { toast } = useToast();

  // تعريف دالة معالجة OCR المتوافقة مع الواجهة OcrProcessFn
  const processWithOcr: OcrProcessFn = async (image: CustomImageData): Promise<string> => {
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

  // إضافة دالة معالجة OCR متوافقة مع واجهة ImageProcessFn
  const processFileWithOcr = async (file: File, image: CustomImageData): Promise<CustomImageData> => {
    try {
      console.log("بدء معالجة OCR للملف:", file.name, "للصورة:", image.id);
      
      // استدعاء خدمة OCR مع ملف الصورة
      const result = await extractTextFromImage(file);
      console.log("نتيجة OCR:", result);
      
      // إرجاع نسخة محدثة من الصورة بالنص المستخرج
      return {
        ...image,
        extractedText: result.text,
        confidence: result.confidence,
        extractionMethod: "ocr"
      };
    } catch (ocrError) {
      console.error("خطأ في معالجة OCR للملف:", ocrError);
      
      toast({
        title: "فشل في استخراج النص",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      return {
        ...image,
        extractedText: "",
        status: "error",
        error: "فشل في معالجة OCR"
      };
    }
  };

  return { 
    processWithOcr,
    processFileWithOcr 
  };
};

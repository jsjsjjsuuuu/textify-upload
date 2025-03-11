
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/parsers";
import { useToast } from "@/hooks/use-toast";

export const useOcrProcessing = () => {
  const { toast } = useToast();

  const processWithOcr = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("Calling extractTextFromImage for OCR");
      const result = await extractTextFromImage(file);
      console.log("OCR result:", result);
      
      // Try to parse data from OCR text
      const extractedData = parseDataFromOCRText(result.text);
      console.log("Parsed data from OCR text:", extractedData);
      
      return updateImageWithExtractedData(
        image, 
        result.text, 
        extractedData, 
        result.confidence, 
        "ocr"
      );
    } catch (ocrError) {
      console.error("OCR processing error:", ocrError);
      
      toast({
        title: "فشل في استخراج النص",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error"
      };
    }
  };

  return { processWithOcr };
};

import { useState, useRef } from "react";
import { ImageData } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useToast } from "@/hooks/use-toast";

// مفتاح التخزين المحلي لتتبع الصور المعالجة بالفعل باستخدام OCR
const PROCESSED_IMAGES_KEY = "ocr_processed_images_v1";

export const useOcrProcessing = () => {
  const { toast } = useToast();
  
  // استخدام مرجع للاحتفاظ بقائمة معرفات الصور التي تمت معالجتها بالفعل
  const processedImagesRef = useRef<Set<string>>(
    typeof localStorage !== 'undefined' && localStorage.getItem(PROCESSED_IMAGES_KEY)
      ? new Set(JSON.parse(localStorage.getItem(PROCESSED_IMAGES_KEY) || '[]'))
      : new Set<string>()
  );

  // حفظ قائمة الصور المعالجة في التخزين المحلي
  const saveProcessedImages = () => {
    try {
      localStorage.setItem(
        PROCESSED_IMAGES_KEY, 
        JSON.stringify(Array.from(processedImagesRef.current))
      );
    } catch (e) {
      console.error("خطأ في حفظ قائمة الصور المعالجة:", e);
    }
  };

  // تحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
  const isImageProcessed = (imageId: string): boolean => {
    return processedImagesRef.current.has(imageId);
  };

  // وضع علامة على الصورة كصورة تمت معالجتها
  const markImageAsProcessed = (imageId: string) => {
    processedImagesRef.current.add(imageId);
    saveProcessedImages();
  };

  // مسح ذاكرة التخزين المؤقت للصور المعالجة
  const clearProcessedImagesCache = () => {
    processedImagesRef.current.clear();
    saveProcessedImages();
    toast({
      title: "تم مسح ذاكرة التخزين المؤقت",
      description: "تم مسح قائمة الصور المعالجة سابقًا"
    });
  };

  const processWithOcr = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      // تحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
      if (isImageProcessed(image.id)) {
        console.log("تم تخطي OCR للصورة المعالجة مسبقاً:", image.id);
        return image;
      }

      console.log("Calling extractTextFromImage for OCR");
      const result = await extractTextFromImage(file);
      console.log("OCR result:", result);
      
      // حاول استخراج البيانات من نص OCR
      const extractedData = parseDataFromOCRText(result.text);
      console.log("Parsed data from OCR text:", extractedData);
      
      // وضع علامة على الصورة كصورة تمت معالجتها
      markImageAsProcessed(image.id);
      
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

  return { 
    processWithOcr, 
    isImageProcessed, 
    clearProcessedImagesCache 
  };
};

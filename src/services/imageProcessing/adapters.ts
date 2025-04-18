
/**
 * محولات لمعالجة الصور
 * هذا الملف يوفر دوال وسيطة للتعامل مع أنواع الوظائف المختلفة
 */
import { CustomImageData, ImageProcessFn, FileImageProcessFn, OcrProcessFn, GeminiProcessFn } from "@/types/ImageData";

/**
 * تحويل دالة OcrProcessFn إلى دالة ImageProcessFn
 */
export function adaptOcrToImageProcess(ocrFn: (file: File, image: CustomImageData) => Promise<CustomImageData>): ImageProcessFn {
  return async (file: File, options?: any): Promise<CustomImageData> => {
    // إنشاء كائن CustomImageData مبسط باستخدام معرف مؤقت في حالة عدم توفر options
    const image: CustomImageData = {
      id: options?.id || 'temp-id',
      ...options as CustomImageData,
    };
    
    try {
      // استدعاء دالة OCR مع الملف وكائن الصورة
      const result = await ocrFn(file, image);
      return {
        ...result,
        extractionMethod: "ocr"
      };
    } catch (error) {
      console.error("خطأ في تنفيذ OCR:", error);
      return {
        ...image,
        errorMessage: error instanceof Error ? error.message : "خطأ غير معروف",
        status: "error"
      };
    }
  };
}

/**
 * تحويل دالة GeminiProcessFn إلى دالة FileImageProcessFn
 */
export function adaptGeminiToFileImageProcess(geminiFn: GeminiProcessFn): FileImageProcessFn {
  return async (fileOrBlob: File | Blob, image: CustomImageData): Promise<CustomImageData> => {
    // تحويل الكائن إلى File إذا كان من نوع Blob
    const file = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], "image.png", { type: fileOrBlob.type });
    
    // إنشاء نسخة من الصورة مع الملف
    const imageWithFile: CustomImageData = { 
      ...image,
      file 
    };

    try {
      // استدعاء دالة Gemini مع الصورة
      const result = await geminiFn(imageWithFile);
      
      return {
        ...image,
        ...result,
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في تنفيذ Gemini:", error);
      return {
        ...image,
        errorMessage: error instanceof Error ? error.message : "خطأ غير معروف",
        status: "error"
      };
    }
  };
}

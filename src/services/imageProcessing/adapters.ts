
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
      console.error("خطأ في معالجة OCR:", error);
      return {
        ...image,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "خطأ غير معروف"
      };
    }
  };
}

/**
 * تحويل دالة GeminiProcessFn إلى دالة FileImageProcessFn
 */
export function adaptGeminiToFileImageProcess(geminiFn: (file: File | Blob, image: CustomImageData) => Promise<CustomImageData>): FileImageProcessFn {
  return async (file: File | Blob, image: CustomImageData, updateProgress?: (progress: number) => void): Promise<CustomImageData> => {
    try {
      // إذا كان هناك دالة لتحديث التقدم، استدعيها في البداية
      if (updateProgress) {
        updateProgress(10);
      }
      
      // استدعاء دالة Gemini
      const result = await geminiFn(file, image);
      
      // إذا كان هناك دالة لتحديث التقدم، استدعيها في النهاية
      if (updateProgress) {
        updateProgress(100);
      }
      
      return {
        ...result,
        extractionMethod: "gemini"
      };
    } catch (error) {
      console.error("خطأ في معالجة Gemini:", error);
      return {
        ...image,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "خطأ غير معروف"
      };
    }
  };
}

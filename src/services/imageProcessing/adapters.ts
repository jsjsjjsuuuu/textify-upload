
/**
 * محولات لمعالجة الصور
 * هذا الملف يوفر دوال وسيطة للتعامل مع أنواع الوظائف المختلفة
 */
import { CustomImageData, ImageProcessFn, FileImageProcessFn, OcrProcessFn, GeminiProcessFn } from "@/types/ImageData";

/**
 * تحويل دالة OcrProcessFn إلى دالة ImageProcessFn
 */
export function adaptOcrToImageProcess(ocrFn: OcrProcessFn): ImageProcessFn {
  return async (file: File, image: CustomImageData): Promise<CustomImageData> => {
    const extractedText = await ocrFn({...image, file});
    return {
      ...image,
      extractedText,
      extractionMethod: "ocr"
    };
  };
}

/**
 * تحويل دالة GeminiProcessFn إلى دالة FileImageProcessFn
 */
export function adaptGeminiToFileImageProcess(geminiFn: GeminiProcessFn): FileImageProcessFn {
  return async (file: File | Blob, image: CustomImageData): Promise<CustomImageData> => {
    const result = await geminiFn({...image, file});
    return {
      ...image,
      ...result,
      extractionMethod: "gemini"
    };
  };
}

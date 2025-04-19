
// محولات لضمان توافق أنواع البيانات
import { CustomImageData, ImageProcessFn } from "@/types/ImageData";

// محول لوظيفة معالجة OCR
export const adaptOcrToImageProcess = (
  ocrProcessor: (file: File, imageData: CustomImageData) => Promise<CustomImageData>
): ((file: File, imageData: CustomImageData) => Promise<CustomImageData>) => {
  return async (file: File, imageData: CustomImageData) => {
    return ocrProcessor(file, imageData);
  };
};

// محول لوظيفة معالجة Gemini
export const adaptGeminiToFileImageProcess = (
  geminiProcessor: (file: File, imageData: CustomImageData) => Promise<CustomImageData>
): ((file: File, imageData: CustomImageData) => Promise<CustomImageData>) => {
  return async (file: File, imageData: CustomImageData) => {
    return geminiProcessor(file, imageData);
  };
};

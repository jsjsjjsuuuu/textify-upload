
import { ImageData } from "@/types/ImageData";

/**
 * إنشاء هاش (بصمة) للصورة من البيانات
 * @param image صورة للتشفير
 * @returns سلسلة تحتوي على هاش محسوب
 */
export const createImageHash = (image: ImageData): string => {
  // استخدام البيانات المهمة من الصورة لإنشاء هاش فريد
  const hashComponents = [
    image.fileName || '',
    image.fileSize || 0,
    image.fileType || '',
    image.rawText || '',
    image.extractedText || ''
  ];

  // دمج جميع المكونات وإنشاء هاش بسيط
  return hashComponents.join('|');
};

/**
 * الحصول على هاش صورة (غطاء لوظيفة createImageHash)
 */
export const getImageHash = createImageHash;

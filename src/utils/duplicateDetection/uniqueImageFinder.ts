
import { createImageHash } from './imageHasher';
import { compareHashes } from './imageMatcher';
import { ImageData } from '@/types/ImageData';

// تخزين بصمات الصور المعالجة مسبقًا
const processedHashes: Map<string, string> = new Map();

/**
 * فحص ما إذا كانت الصورة مكررة
 * @param image بيانات الصورة للفحص
 * @param existingImages قائمة الصور الموجودة للمقارنة
 * @returns وعد يحتوي على نتيجة الفحص (true إذا كانت مكررة)
 */
export const isDuplicateImage = async (
  image: File,
  existingImages: ImageData[]
): Promise<boolean> => {
  // إذا كانت قائمة الصور الحالية فارغة، فالصورة غير مكررة
  if (!existingImages || existingImages.length === 0) {
    return false;
  }

  try {
    // إنشاء بصمة للصورة الجديدة
    const newImageHash = await createImageHash(image);

    // البحث عن تطابق في الصور الموجودة
    for (const existingImage of existingImages) {
      // تخطي الصور التي ليس لها ملف
      if (!existingImage.file) continue;

      // الحصول على بصمة الصورة الموجودة أو إنشاؤها
      let existingHash = processedHashes.get(existingImage.id);

      if (!existingHash) {
        // استخدام معرف الصورة كبصمة مؤقتة لتجنب الأخطاء في الأنواع
        existingHash = existingImage.id;
        processedHashes.set(existingImage.id, existingHash);
      }

      // مقارنة البصمات
      const similarityScore = compareHashes(newImageHash, existingHash);
      
      // إذا كانت نسبة التشابه أكبر من الحد (0.9)، فالصورة مكررة
      if (similarityScore > 0.9) {
        return true;
      }
    }

    // لم يتم العثور على أي تطابق
    return false;
  } catch (error) {
    console.error('خطأ في فحص تكرار الصورة:', error);
    // في حالة الخطأ، نفترض أن الصورة غير مكررة
    return false;
  }
};

/**
 * تسجيل صورة كمعالجة لتجنب إعادة المعالجة
 * @param image بيانات الصورة المراد تسجيلها
 */
export const markImageAsProcessed = (image: ImageData): void => {
  if (image.id) {
    // استخدام معرف الصورة كبصمة مؤقتة
    processedHashes.set(image.id, image.id);
  }
};

/**
 * مسح بصمات الصور المعالجة
 */
export const clearProcessedHashes = (): void => {
  processedHashes.clear();
};

/**
 * الحصول على عدد الصور المعالجة والمسجلة
 */
export const getProcessedImagesCount = (): number => {
  return processedHashes.size;
};

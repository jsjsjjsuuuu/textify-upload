
import { ImageData } from "@/types/ImageData";
import CryptoJS from 'crypto-js';

/**
 * إنشاء تجزئة لصورة استنادًا إلى بياناتها
 * @param image بيانات الصورة
 * @returns سلسلة تجزئة فريدة
 */
export const createImageHash = (image: ImageData): string => {
  // إنشاء سلسلة فريدة من بيانات الصورة
  const uniqueString = `${image.file.name}-${image.file.size}-${image.file.lastModified}`;
  // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
  return CryptoJS.MD5(uniqueString).toString();
};

/**
 * التحقق من تطابق اثنين من الصور
 * @param image1 الصورة الأولى
 * @param image2 الصورة الثانية
 * @returns هل الصورتان متطابقتان
 */
export const imagesMatch = (image1: ImageData, image2: ImageData): boolean => {
  // التحقق من تطابق الخصائص الأساسية للملف
  return (
    image1.file.name === image2.file.name &&
    image1.file.size === image2.file.size &&
    image1.file.lastModified === image2.file.lastModified
  );
};

/**
 * التحقق مما إذا كانت الصورة موجودة بالفعل في قائمة الصور
 * @param image الصورة للتحقق منها
 * @param images قائمة الصور للمقارنة
 * @param ignoreTemporary تجاهل الصور المؤقتة
 * @returns هل الصورة مكررة
 */
export const isImageDuplicate = (
  image: ImageData,
  images: ImageData[],
  ignoreTemporary: boolean = true
): boolean => {
  if (!image || !images || images.length === 0) {
    return false;
  }

  return images.some((existingImage) => {
    // إذا كان ignoreTemporary مفعلاً، تجاهل الصور المؤقتة
    if (ignoreTemporary && existingImage.sessionImage === true) {
      return false;
    }

    // التحقق من التطابق
    return imagesMatch(image, existingImage);
  });
};

/**
 * إيجاد الصور المكررة في قائمة الصور
 * @param images قائمة الصور للتحقق
 * @returns قائمة من الصور الفريدة (بعد إزالة التكرارات)
 */
export const findDuplicateImages = (images: ImageData[]): ImageData[] => {
  const uniqueImagesMap = new Map<string, ImageData>();
  
  // استخدام خوارزمية للتخزين المؤقت للصور الفريدة
  images.forEach(img => {
    // إنشاء مفتاح فريد
    const key = createImageHash(img);
    
    // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
    if (!uniqueImagesMap.has(key) || 
        (img.added_at && uniqueImagesMap.get(key)?.added_at && img.added_at > uniqueImagesMap.get(key)!.added_at!)) {
      uniqueImagesMap.set(key, img);
    }
  });
  
  // تحويل الخريطة إلى مصفوفة
  return Array.from(uniqueImagesMap.values());
};

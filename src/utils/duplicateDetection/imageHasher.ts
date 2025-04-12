
import { ImageData } from "@/types/ImageData";
import CryptoJS from 'crypto-js';

/**
 * إنشاء تجزئة لصورة استنادًا إلى بياناتها بشكل محسن
 * @param image بيانات الصورة
 * @returns سلسلة تجزئة فريدة
 */
export const createImageHash = (image: ImageData): string => {
  // إنشاء سلسلة فريدة تتضمن المزيد من المعلومات
  if (!image || !image.file) {
    // إذا كانت الصورة أو الملف غير موجود، استخدم المعرف فقط
    return `id-${image.id || 'unknown'}`;
  }
  
  const uniqueIdentifiers = [
    image.file.name,
    image.file.size.toString(),
    image.file.lastModified.toString(),
    image.user_id || '',
    image.batch_id || '',
    image.id || '' // إضافة معرف الصورة للتجزئة أيضًا
  ].join('|');
  
  // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
  return CryptoJS.MD5(uniqueIdentifiers).toString();
};

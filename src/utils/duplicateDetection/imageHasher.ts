
import { v4 as uuidv4 } from 'uuid';
import { ImageData } from "@/types/ImageData";

/**
 * دالة لإنشاء تجزئة فريدة للصورة بناءً على محتواها وبيانات المستخدم
 * @param image كائن الصورة
 * @returns تجزئة فريدة للصورة
 */
export async function hashImage(image: ImageData): Promise<string> {
  // بادئة اختيارية بمعرف المستخدم لضمان عدم وجود تطابقات عبر المستخدمين
  const prefix = image.userId ? `${image.userId}:` : '';
  
  // بيانات الصورة الأساسية
  const imageData = `${image.fileName || 'unknown'}:${image.fileSize || 0}:${image.fileType || 'unknown'}`;
  
  // إنشاء معرف فريد مؤقت
  const tempId = uuidv4();
  
  // دمج البيانات لإنشاء التجزئة
  const combinedData = `${prefix}${imageData}:${tempId}`;
  
  // تحويل النص إلى بيانات ثنائية (ArrayBuffer)
  const encoder = new TextEncoder();
  const data = encoder.encode(combinedData);
  
  // استخدام Web Crypto API لإنشاء التجزئة
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // تحويل ArrayBuffer إلى سلسلة hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// تعريفات بديلة للوظائف المستخدمة في الملفات الأخرى
export const getImageHash = hashImage;
export const createImageHash = (image: ImageData): string => {
  // نسخة مبسطة للاستخدام المباشر (غير متزامنة)
  const prefix = image.userId ? `${image.userId}:` : '';
  const imageData = `${image.fileName || 'unknown'}:${image.fileSize || 0}:${image.fileType || 'unknown'}`;
  const tempId = uuidv4();
  return `${prefix}${imageData}:${tempId}`;
};

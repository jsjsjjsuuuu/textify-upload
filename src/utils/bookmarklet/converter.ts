
/**
 * وحدة تحويل البيانات للبوكماركلت
 */

import { ImageData } from "@/types/ImageData";
import { BookmarkletItem } from "./types";

/**
 * تحويل بيانات الصور إلى تنسيق البوكماركلت
 */
export const convertImagesToBookmarkletItems = (images: ImageData[]): BookmarkletItem[] => {
  if (!images || images.length === 0) {
    return [];
  }

  return images
    .filter(img => img.code && img.senderName && img.phoneNumber) // تصفية الصور التي تحتوي على البيانات الأساسية
    .map(img => ({
      id: img.id || generateId(),
      code: img.code || '',
      senderName: img.senderName || '',
      phoneNumber: img.phoneNumber || '',
      province: img.province || '',
      price: img.price || '',
      companyName: img.companyName || '',
      exportDate: new Date().toISOString(),
      status: 'ready',
      address: img.address || '',
      notes: img.notes || '',
      recipientName: img.recipientName || '',
      // يمكن إضافة المزيد من الحقول هنا
    }));
};

/**
 * توليد معرف فريد
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * تحويل شفرة جافاسكريبت إلى bookmarklet
 */
export const convertCodeToBookmarklet = (code: string): string => {
  // إزالة المسافات الزائدة والعودات السطرية
  const minifiedCode = code.trim().replace(/\s+/g, ' ');
  
  // تحويل إلى رابط مباشر للتنفيذ
  const bookmarklet = `javascript:(function(){${encodeURIComponent(minifiedCode)}})();`;
  
  return bookmarklet;
};

/**
 * كائن يجمع وظائف التحويل المختلفة
 */
export const converter = {
  codeToBookmarklet: convertCodeToBookmarklet,
  imagesToBookmarkletItems: convertImagesToBookmarkletItems
};

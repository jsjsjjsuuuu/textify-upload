
/**
 * وحدة تحويل البيانات للتصدير
 */

import { ImageData } from "@/types/ImageData";
import { BookmarkletItem } from "@/utils/bookmarklet/types";

/**
 * تحويل بيانات الصور إلى تنسيق قابل للتصدير
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
      notes: img.notes1 || '',
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
 * تحويل البيانات إلى نص CSV للتصدير
 */
export const convertToCSV = (items: BookmarkletItem[]): string => {
  if (!items || items.length === 0) {
    return '';
  }

  // تحديد رؤوس الأعمدة
  const headers = [
    'الكود',
    'اسم المرسل',
    'رقم الهاتف',
    'المحافظة',
    'السعر',
    'اسم الشركة',
    'تاريخ التصدير',
    'العنوان',
    'الملاحظات',
    'اسم المستلم'
  ];

  // تجميع البيانات بتنسيق CSV
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const item of items) {
    const row = [
      `"${item.code}"`,
      `"${item.senderName}"`,
      `"${item.phoneNumber}"`,
      `"${item.province}"`,
      `"${item.price}"`,
      `"${item.companyName}"`,
      `"${item.exportDate}"`,
      `"${item.address || ''}"`,
      `"${item.notes || ''}"`,
      `"${item.recipientName || ''}"`
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
};

/**
 * تحويل البيانات إلى كائن JSON للتصدير
 */
export const convertToJSON = (items: BookmarkletItem[]): string => {
  return JSON.stringify(items, null, 2);
};

/**
 * تحويل البيانات إلى تنسيق Excel (تصدير CSV)
 */
export const convertToExcel = (items: BookmarkletItem[]): string => {
  // استخدام نفس تنسيق CSV مع بعض التعديلات للتوافق مع Excel
  return convertToCSV(items);
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
  imagesToBookmarkletItems: convertImagesToBookmarkletItems,
  toCSV: convertToCSV,
  toJSON: convertToJSON,
  toExcel: convertToExcel
};

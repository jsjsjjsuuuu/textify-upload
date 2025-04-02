
import { ImageData, BookmarkletItem } from "@/types/ImageData";

// تحويل بيانات الصور إلى عناصر بوكماركلت
export const convertImagesToBookmarkletItems = (images: ImageData[]): BookmarkletItem[] => {
  if (!images || images.length === 0) {
    return [];
  }
  
  return images
    .filter(image => 
      image.status === "completed" && 
      image.code && 
      image.senderName && 
      image.phoneNumber
    )
    .map(image => ({
      id: image.id,
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || "",
      notes: image.notes || "",
      recipientName: image.recipientName || "",
      exportDate: new Date().toISOString(),
      status: "ready"
    }));
};

// تحويل شيفرة جافاسكريبت إلى شكل رابط البوكماركلت
export const convertCodeToBookmarklet = (code: string): string => {
  // تنظيف الكود (إزالة التعليقات والمسافات الزائدة)
  const cleanedCode = code
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // إزالة التعليقات
    .replace(/\s+/g, ' ') // استبدال المسافات المتعددة بمسافة واحدة
    .trim();
  
  // تشفير الكود ليكون صالحًا في عنوان URL
  return `javascript:${encodeURIComponent(cleanedCode)}`;
};

// تحويل البيانات إلى تنسيق CSV
export const convertToCSV = (items: BookmarkletItem[]): string => {
  if (!items || items.length === 0) {
    return "";
  }
  
  // استخراج أسماء الحقول من العنصر الأول
  const fields = ['code', 'senderName', 'phoneNumber', 'province', 'price', 'companyName', 'notes', 'recipientName'];
  
  // إنشاء سطر العناوين
  const headerRow = fields.join(',');
  
  // إنشاء صفوف البيانات
  const dataRows = items.map(item => {
    return fields.map(field => {
      const value = item[field as keyof typeof item];
      // التعامل مع القيم التي تحتوي على فواصل أو أقواس مزدوجة
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  // دمج الرأس مع الصفوف
  return [headerRow, ...dataRows].join('\n');
};

// تحويل البيانات إلى تنسيق JSON
export const convertToJSON = (items: BookmarkletItem[]): string => {
  return JSON.stringify(items, null, 2);
};

// تحويل البيانات إلى تنسيق مناسب للإكسل (CSV)
export const convertToExcel = (items: BookmarkletItem[]): string => {
  // استخدام نفس دالة تحويل CSV للإكسل لأن Excel يمكنه فتح ملفات CSV
  return convertToCSV(items);
};

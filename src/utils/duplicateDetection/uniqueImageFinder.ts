
import { ImageData } from "@/types/ImageData";

/**
 * إيجاد الصور المتشابهة وإبقاء الأحدث منها
 * @param images قائمة الصور للمعالجة
 * @returns قائمة بالصور الفريدة (بعد إزالة التكرارات)
 */
export function findDuplicateImages(images: ImageData[]): ImageData[] {
  // نسخ الصور لعدم تعديل المصفوفة الأصلية
  const imagesCopy = [...images];
  
  // إذا كان لدينا عدد قليل من الصور، ارجع المصفوفة كما هي
  if (imagesCopy.length <= 1) {
    return imagesCopy;
  }
  
  // مصفوفة تخزين للصور الفريدة
  const uniqueImages: ImageData[] = [];
  // مجموعة للاحتفاظ بمعرفات الصور التي تمت معالجتها بالفعل
  const processedIds = new Set<string>();
  
  // فرز الصور حسب تاريخ الإضافة (الأحدث أولاً)
  imagesCopy.sort((a, b) => {
    const timeA = a.uploadTimestamp || 0;
    const timeB = b.uploadTimestamp || 0;
    return timeB - timeA;
  });
  
  // للتبسيط، نحتفظ بالصور الفريدة فقط بناءً على المعرف
  for (const image of imagesCopy) {
    if (!processedIds.has(image.id)) {
      uniqueImages.push(image);
      processedIds.add(image.id);
    }
  }
  
  return uniqueImages;
}

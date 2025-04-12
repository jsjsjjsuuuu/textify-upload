
import { ImageData } from "@/types/ImageData";
import { createImageHash } from "./imageHasher";

/**
 * إيجاد الصور المكررة في قائمة الصور مع تحسين الأداء
 * @param images قائمة الصور للتحقق
 * @returns قائمة من الصور الفريدة (بعد إزالة التكرارات)
 */
export const findDuplicateImages = (images: ImageData[]): ImageData[] => {
  if (!images || images.length === 0) {
    return [];
  }
  
  const uniqueImagesMap = new Map<string, ImageData>();
  const idMap = new Map<string, boolean>();
  
  // ابتداء بالصور ذات الحالة "completed" للتأكد من الاحتفاظ بالصور المكتملة
  const sortedImages = [...images].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    return 0;
  });
  
  // استخدام معرّف الصورة كمفتاح للتخزين المؤقت
  sortedImages.forEach(img => {
    // تجاهل الصور التي ليس لها معرف
    if (!img || !img.id) return;
    
    // تسجيل معرف الصورة
    idMap.set(img.id, true);
    
    // إنشاء مفتاح فريد أكثر دقة
    let key: string;
    
    if (img.file) {
      key = createImageHash(img);
    } else {
      // للصور بدون ملف، استخدم معرف الصورة وأي معلومات أخرى متوفرة
      key = `id-${img.id}-${img.code || ''}-${img.phoneNumber || ''}`;
    }
    
    // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
    // أو إذا كانت الصورة الحالية مكتملة والصورة الموجودة غير مكتملة
    const existingImage = uniqueImagesMap.get(key);
    
    // المقارنة حسب الأولوية:
    // 1. الحالة: مكتملة > في الانتظار > خطأ > معالجة
    // 2. البيانات: يوجد بيانات > لا يوجد بيانات
    // 3. الوقت: الأحدث > الأقدم
    
    const currentIsNewer = img.added_at && existingImage?.added_at && img.added_at > existingImage.added_at;
    
    const currentIsComplete = img.status === "completed" && existingImage?.status !== "completed";
    
    const currentHasMoreData = 
      !!img.extractedText && 
      !!img.code && 
      !!img.senderName && 
      !!img.phoneNumber && 
      (!existingImage?.extractedText || !existingImage?.code || !existingImage?.senderName || !existingImage?.phoneNumber);
    
    const shouldReplace = !existingImage || currentIsComplete || currentHasMoreData || (currentIsNewer && existingImage.status !== "completed");
    
    if (shouldReplace) {
      uniqueImagesMap.set(key, img);
    }
  });
  
  // تحويل الخريطة إلى مصفوفة
  return Array.from(uniqueImagesMap.values());
};

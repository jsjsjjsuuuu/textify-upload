
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

/**
 * وظيفة إزالة التكرارات من مصفوفة الصور بناءً على خوارزمية متطورة
 */
export const removeDuplicatesFromImages = (
  images: ImageData[],
  showToast: boolean = true
): { deduplicatedImages: ImageData[], removedCount: number } => {
  const toast = useToast?.();
  
  // إنشاء وظيفة منفصلة لإنشاء مفاتيح فريدة
  const generateUniqueImageKey = (img: ImageData) => {
    // استخدام مزيج من خصائص متعددة لإنشاء مفتاح أكثر دقة
    const fileNameComponent = img.file?.name || 'unknown';
    const fileContentComponent = img.code || '';
    const userComponent = img.user_id || 'anonymous';
    const batchComponent = img.batch_id || 'default';
    const processingComponent = img.processingId || '';
    
    // إضافة حجم الملف والنوع كمؤشرات إضافية لتحقيق تفرد أكبر
    const fileSizeComponent = img.file?.size?.toString() || '0';
    const fileTypeComponent = img.file?.type || 'unknown';
    
    return `${fileNameComponent}_${fileContentComponent}_${userComponent}_${batchComponent}_${processingComponent}_${fileSizeComponent}_${fileTypeComponent}`;
  };
  
  const uniqueImagesMap = new Map<string, ImageData>();
  
  // استخدام مفتاح أكثر دقة للتخزين المؤقت للصور الفريدة
  images.forEach(img => {
    // إنشاء مفتاح فريد باستخدام الوظيفة المشتركة
    const key = generateUniqueImageKey(img);
    
    // تجاهل الصور الفارغة أو غير الصالحة
    if (!img.file || !img.id) {
      return;
    }
    
    // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
    // أو إذا كانت الصورة الحالية مكتملة والصورة السابقة في حالة خطأ
    const existingImage = uniqueImagesMap.get(key);
    
    const shouldReplace = (
      // حالة 1: لا توجد صورة سابقة بهذا المفتاح
      !existingImage || 
      // حالة 2: الصورة الحالية أحدث (على أساس الطابع الزمني)
      (img.added_at && existingImage.added_at && img.added_at > existingImage.added_at) ||
      // حالة 3: الصورة السابقة في حالة خطأ والصورة الحالية ليست كذلك
      (existingImage.status === 'error' && img.status !== 'error') ||
      // حالة 4: الصورة الحالية مكتملة والصورة السابقة ليست كذلك
      (img.status === 'completed' && existingImage.status !== 'completed') ||
      // حالة 5: الصورة الحالية لديها بيانات أكثر اكتمالاً
      (Boolean(img.code) && Boolean(img.senderName) && Boolean(img.phoneNumber) &&
       (!existingImage.code || !existingImage.senderName || !existingImage.phoneNumber))
    );
    
    if (shouldReplace) {
      uniqueImagesMap.set(key, img);
    }
  });
  
  // تحويل الخريطة إلى مصفوفة
  const deduplicatedImages = Array.from(uniqueImagesMap.values());
  const removedCount = images.length - deduplicatedImages.length;
  
  // إظهار إشعار إذا تم طلب ذلك وإذا تم العثور على تكرارات
  if (showToast && removedCount > 0 && toast?.toast) {
    toast.toast({
      title: "تمت إزالة التكرارات",
      description: `تم حذف ${removedCount} صورة مكررة`
    });
    
    console.log(`تم إزالة ${removedCount} صورة مكررة. الصور المتبقية: ${deduplicatedImages.length}`);
  } else if (removedCount === 0) {
    console.log("لا توجد صور مكررة للإزالة");
  }
  
  return { deduplicatedImages, removedCount };
};

/**
 * وظيفة إنشاء معرف فريد للعمليات
 */
export const generateProcessingId = (): string => {
  return `proc_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
};

/**
 * وظيفة لتحديد ما إذا كانت صورة مكررة في مجموعة من الصور
 */
export const isDuplicateImage = (image: ImageData, existingImages: ImageData[]): boolean => {
  // نفس منطق إنشاء المفتاح الفريد من الوظيفة السابقة
  const generateUniqueImageKey = (img: ImageData) => {
    const fileNameComponent = img.file?.name || 'unknown';
    const fileContentComponent = img.code || '';
    const userComponent = img.user_id || 'anonymous';
    const batchComponent = img.batch_id || 'default';
    const processingComponent = img.processingId || '';
    const fileSizeComponent = img.file?.size?.toString() || '0';
    const fileTypeComponent = img.file?.type || 'unknown';
    
    return `${fileNameComponent}_${fileContentComponent}_${userComponent}_${batchComponent}_${processingComponent}_${fileSizeComponent}_${fileTypeComponent}`;
  };
  
  const newImageKey = generateUniqueImageKey(image);
  
  return existingImages.some(existingImage => 
    existingImage.id === image.id || 
    generateUniqueImageKey(existingImage) === newImageKey
  );
};

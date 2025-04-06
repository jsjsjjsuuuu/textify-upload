
import { ImageData } from "@/types/ImageData";
import CryptoJS from 'crypto-js';

/**
 * إنشاء تجزئة لصورة استنادًا إلى بياناتها بشكل محسن
 * @param image بيانات الصورة
 * @returns سلسلة تجزئة فريدة
 */
export const createImageHash = (image: ImageData): string => {
  if (!image || !image.file) {
    return 'invalid-image';
  }
  
  // إنشاء سلسلة فريدة باستخدام معلومات أكثر استقراراً
  const uniqueIdentifiers = [
    image.file.name,
    image.file.size.toString(),
    image.file.lastModified.toString(),
    image.user_id || '',
    image.batch_id || '',
    image.id || '' // إضافة المعرف لتحسين التمييز
  ].filter(Boolean).join('|');
  
  // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
  return CryptoJS.MD5(uniqueIdentifiers).toString();
};

/**
 * التحقق من تطابق اثنين من الصور بمعايير أكثر دقة
 * @param image1 الصورة الأولى
 * @param image2 الصورة الثانية
 * @returns هل الصورتان متطابقتان
 */
export const imagesMatch = (image1: ImageData, image2: ImageData): boolean => {
  // التحقق من وجود الملفات والمعرفات الأساسية قبل المقارنة
  if (!image1 || !image2 || !image1.file || !image2.file || !image1.id || !image2.id) {
    return false;
  }
  
  // لا نريد مقارنة الصورة مع نفسها
  if (image1.id === image2.id) {
    return false;
  }
  
  // التحقق من المستخدم
  const sameUser = image1.user_id === image2.user_id;
  
  // التحقق من تطابق الخصائص الأساسية للملف
  const sameFile = 
    image1.file.name === image2.file.name &&
    image1.file.size === image2.file.size &&
    image1.file.lastModified === image2.file.lastModified;
  
  // إذا كان النص المستخرج موجوداً، يمكن استخدامه للمقارنة
  const sameExtractedText = 
    image1.extractedText && 
    image2.extractedText && 
    image1.extractedText === image2.extractedText;
  
  // يجب أن تكون من نفس المستخدم ولنفس الملف
  const isMatch = sameUser && sameFile;
  
  // إذا كان النص المستخرج متطابقاً، فهذا يزيد من احتمال التطابق
  return isMatch || (sameUser && sameExtractedText);
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
  if (!image || !images || images.length === 0 || !image.file) {
    return false;
  }

  // تجنب الصور الخاطئة في عملية الاكتشاف
  if (image.status === "error") {
    return false;
  }
  
  // إذا كانت الصورة المراد فحصها مؤقتة، وتم تمكين تجاهل المؤقت، فلا نعتبرها مكررة
  if (ignoreTemporary && image.sessionImage === true) {
    return false;
  }

  // التحقق من تكرار معرف الصورة مباشرة أولاً (الطريقة الأكثر دقة)
  if (image.id) {
    const duplicateById = images.some(existingImage => 
      existingImage.id === image.id && existingImage.id !== undefined
    );
    
    if (duplicateById) {
      console.log(`تم اكتشاف تكرار بالمعرف للصورة: ${image.id}`);
      return true;
    }
  }

  // استخدام مقارنة أكثر مرونة لاكتشاف التكرارات المحتملة
  const duplicate = images.some((existingImage) => {
    // تجنب مقارنة الصورة بنفسها
    if (existingImage.id === image.id) {
      return false;
    }
    
    // إذا كان ignoreTemporary مفعلاً، تجاهل الصور المؤقتة
    if (ignoreTemporary && existingImage.sessionImage === true) {
      return false;
    }
    
    // هل هي في نفس المجموعة (إذا كانت متوفرة)
    const sameBatch = 
      (image.batch_id && existingImage.batch_id) ? 
      image.batch_id === existingImage.batch_id : 
      true;
    
    // التحقق من التطابق مع معايير أكثر دقة
    const isMatch = imagesMatch(image, existingImage);
    
    // تسجيل سبب اعتبار الصورة مكررة للتصحيح في المستقبل
    if (isMatch && sameBatch) {
      console.log(`تم اكتشاف تكرار للصورة ${image.id} مع الصورة ${existingImage.id} (اسم الملف: ${image.file.name})`);
    }
    
    return isMatch && sameBatch;
  });

  return duplicate;
};

/**
 * إيجاد الصور المكررة في قائمة الصور مع تحسين الأداء
 * @param images قائمة الصور للتحقق
 * @returns قائمة من الصور الفريدة (بعد إزالة التكرارات)
 */
export const findDuplicateImages = (images: ImageData[]): ImageData[] => {
  const uniqueImagesMap = new Map<string, ImageData>();
  
  // استخدام خوارزمية محسنة للتخزين المؤقت للصور الفريدة
  images.forEach(img => {
    // تجاهل الصور التي ليس لها معرف أو ملف
    if (!img || !img.id || !img.file) return;
    
    // إنشاء مفتاح فريد أكثر دقة
    const key = createImageHash(img);
    
    // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
    const existingImage = uniqueImagesMap.get(key);
    const shouldReplace = !existingImage || 
                        (img.added_at && existingImage.added_at && 
                         img.added_at > existingImage.added_at);
    
    if (shouldReplace) {
      uniqueImagesMap.set(key, img);
    }
  });
  
  // تحويل الخريطة إلى مصفوفة
  return Array.from(uniqueImagesMap.values());
};

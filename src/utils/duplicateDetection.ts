
import { ImageData } from "@/types/ImageData";
import CryptoJS from 'crypto-js';

/**
 * إنشاء تجزئة لصورة استنادًا إلى بياناتها بشكل محسن
 * @param image بيانات الصورة
 * @returns سلسلة تجزئة فريدة
 */
export const createImageHash = (image: ImageData): string => {
  // إنشاء سلسلة فريدة تتضمن المزيد من المعلومات
  const uniqueIdentifiers = [
    image.file.name,
    image.file.size.toString(),
    image.file.lastModified.toString(),
    image.user_id || '',
    image.batch_id || ''
  ].join('|');
  
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
  // التحقق من وجود الملفات قبل المقارنة
  if (!image1 || !image2 || !image1.file || !image2.file) {
    return false;
  }
  
  // التحقق من المستخدم والمجموعة
  const sameUser = image1.user_id === image2.user_id;
  
  // التحقق من تطابق الخصائص الأساسية للملف
  const sameFile = 
    image1.file.name === image2.file.name &&
    image1.file.size === image2.file.size &&
    image1.file.lastModified === image2.file.lastModified;
  
  // التحقق من عدم وجود معرف مختلف (إذا كانت الصورتان مختلفتين)
  const differentIds = image1.id !== image2.id;
  
  // لا نريد اعتبار الصورة نفسها تكرارًا
  if (!differentIds) {
    return false;
  }
  
  // يجب أن تكون من نفس المستخدم ولنفس الملف
  return sameUser && sameFile;
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

  // إذا كانت الصورة المراد فحصها مؤقتة، وتم تمكين تجاهل المؤقت، فلا نعتبرها مكررة
  if (ignoreTemporary && image.sessionImage === true) {
    return false;
  }

  // استخدام معرف الصورة للتحقق من التكرار - أكثر دقة
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
    
    // التحقق من التطابق مع معايير إضافية
    return imagesMatch(image, existingImage) && sameBatch;
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


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
  
  // التحقق من المستخدم
  const sameUser = image1.user_id === image2.user_id;
  
  // التحقق من تطابق الخصائص الأساسية للملف
  const sameFile = 
    image1.file.name === image2.file.name &&
    image1.file.size === image2.file.size &&
    Math.abs(image1.file.lastModified - image2.file.lastModified) < 5000; // السماح بفارق 5 ثوانٍ
  
  // التحقق من عدم وجود معرف مختلف (إذا كانت الصورتان مختلفتين)
  const differentIds = image1.id !== image2.id;
  
  // **تحقق إضافي: فحص النص المستخرج إذا كان متوفرًا**
  const textSimilar = !!image1.extractedText && !!image2.extractedText && 
                      image1.extractedText.length > 10 && image2.extractedText.length > 10 && 
                      (image1.extractedText.substring(0, 50) === image2.extractedText.substring(0, 50));
  
  // **تحقق إضافي: فحص تطابق الكود إذا كان متوفرًا**
  const sameCode = !!image1.code && !!image2.code && image1.code === image2.code;
  
  // **تحقق إضافي: فحص تطابق رقم الهاتف إذا كان متوفرًا**
  const samePhoneNumber = !!image1.phoneNumber && !!image2.phoneNumber && 
                          image1.phoneNumber.replace(/[^\d]/g, '') === image2.phoneNumber.replace(/[^\d]/g, '');
  
  // إذا كانت الصورة الأولى مكتملة أو بها خطأ، وكذلك الصورة الثانية، والملفان متطابقان، اعتبرهما متطابقتين
  const bothProcessed = 
    (image1.status === "completed" || image1.status === "error") &&
    (image2.status === "completed" || image2.status === "error") &&
    sameFile;
  
  // لا نريد اعتبار الصورة نفسها تكرارًا
  if (!differentIds) {
    return false;
  }
  
  // اعتبار الصور متطابقة إذا كانت من نفس المستخدم ولنفس الملف أو كلاهما معالج
  // أو إذا كان النص المستخرج متشابهًا جدًا أو الكود ورقم الهاتف متطابقين
  return (sameUser && sameFile) || bothProcessed || 
         (sameUser && (textSimilar || (sameCode && samePhoneNumber)));
};

/**
 * التحقق مما إذا كانت الصورة موجودة بالفعل في قائمة الصور مع تحسين لفحص الحالة
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
  
  // **فحص إضافي: إذا كانت الصورة مكتملة المعالجة ولديها جميع البيانات الضرورية**
  const isAlreadyProcessed = image.status === "completed" || image.status === "error";
  const hasExtractedText = !!image.extractedText && image.extractedText.length > 10;
  const hasRequiredFields = !!image.code && !!image.senderName && !!image.phoneNumber;
  
  if (isAlreadyProcessed && hasExtractedText && hasRequiredFields) {
    console.log(`الصورة ${image.id} تمت معالجتها بالفعل ولديها النص المستخرج والحقول المطلوبة`);
    return true;
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
    
    // **فحص إضافي: إذا كانت الحقول الأساسية متطابقة (الكود، رقم الهاتف)**
    const sameKeyFields = 
      !!image.code && !!existingImage.code && image.code === existingImage.code &&
      !!image.phoneNumber && !!existingImage.phoneNumber && 
      image.phoneNumber.replace(/[^\d]/g, '') === existingImage.phoneNumber.replace(/[^\d]/g, '');
    
    if (sameKeyFields) {
      console.log(`تطابق في الحقول الأساسية (الكود ورقم الهاتف) بين ${image.id} و ${existingImage.id}`);
      return true;
    }
    
    // التحقق من وجود نص مستخرج وحقول مطلوبة في الصورة الموجودة
    const existingHasData = 
      !!existingImage.extractedText && 
      existingImage.extractedText.length > 10 && 
      !!existingImage.code && 
      !!existingImage.senderName && 
      !!existingImage.phoneNumber;
    
    // إذا كانت الصورة الحالية والصورة الموجودة متطابقتين والصورة الموجودة لديها بيانات
    if (imagesMatch(image, existingImage) && existingHasData) {
      console.log(`تطابق صورة مع بيانات موجودة: ${image.id} و ${existingImage.id}`);
      return true;
    }
    
    return false;
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
    // أو إذا كانت الصورة الحالية مكتملة والصورة الموجودة غير مكتملة
    const existingImage = uniqueImagesMap.get(key);
    const currentIsNewer = img.added_at && existingImage?.added_at && img.added_at > existingImage.added_at;
    const currentIsComplete = img.status === "completed" && existingImage?.status !== "completed";
    const currentHasMoreData = 
      !!img.extractedText && 
      !!img.code && 
      !!img.senderName && 
      !!img.phoneNumber && 
      (!existingImage?.extractedText || !existingImage?.code || !existingImage?.senderName || !existingImage?.phoneNumber);
    
    const shouldReplace = !existingImage || currentIsNewer || currentIsComplete || currentHasMoreData;
    
    if (shouldReplace) {
      uniqueImagesMap.set(key, img);
    }
  });
  
  // تحويل الخريطة إلى مصفوفة
  return Array.from(uniqueImagesMap.values());
};

/**
 * التحقق من اكتمال معالجة الصورة (لديها جميع البيانات المطلوبة)
 * @param image الصورة للتحقق منها
 * @returns هل الصورة مكتملة المعالجة
 */
export const isFullyProcessed = (image: ImageData): boolean => {
  return (
    !!image.extractedText && 
    image.extractedText.length > 10 && 
    !!image.code && 
    !!image.senderName && 
    !!image.phoneNumber &&
    (image.status === "completed" || image.status === "error")
  );
};

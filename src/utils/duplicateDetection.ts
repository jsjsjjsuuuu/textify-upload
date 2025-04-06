
import { ImageData } from "@/types/ImageData";
import CryptoJS from 'crypto-js';

/**
 * إنشاء تجزئة لصورة استنادًا إلى بياناتها بشكل محسن
 * @param image بيانات الصورة
 * @returns سلسلة تجزئة فريدة
 */
export const createImageHash = (image: ImageData): string => {
  // إنشاء سلسلة فريدة تتضمن المزيد من المعلومات
  if (!image || !image.file) {
    // إذا كانت الصورة أو الملف غير موجود، استخدم المعرف فقط
    return `id-${image.id || 'unknown'}`;
  }
  
  const uniqueIdentifiers = [
    image.file.name,
    image.file.size.toString(),
    image.file.lastModified.toString(),
    image.user_id || '',
    image.batch_id || '',
    image.id || '' // إضافة معرف الصورة للتجزئة أيضًا
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
  // التحقق من وجود معرفات الصور أولاً
  if (!image1 || !image2 || !image1.id || !image2.id) {
    return false;
  }
  
  // الحالة 1: المعرفات متطابقة
  if (image1.id === image2.id) {
    return true;
  }
  
  // التحقق من وجود الملفات للمقارنة
  const hasFiles = image1.file && image2.file;
  
  // التحقق من المستخدم
  const sameUser = image1.user_id === image2.user_id;
  
  // التحقق من تطابق الخصائص الأساسية للملف
  let sameFile = false;
  if (hasFiles) {
    sameFile = 
      image1.file.name === image2.file.name &&
      image1.file.size === image2.file.size &&
      Math.abs(image1.file.lastModified - image2.file.lastModified) < 5000; // السماح بفارق 5 ثوانٍ
  }
  
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
    (image2.status === "completed" || image2.status === "error");
  
  // اعتبار الصور متطابقة إذا كانت من نفس المستخدم ولنفس الملف
  // أو إذا كان النص المستخرج متشابهًا جدًا أو الكود ورقم الهاتف متطابقين
  return (sameUser && sameFile) || 
         (sameUser && (textSimilar || (sameCode && samePhoneNumber))) ||
         (hasFiles && sameFile && bothProcessed);
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
  if (!image || !image.id || !images || images.length === 0) {
    return false;
  }

  // فحص مباشر للمعرف في قائمة الصور
  const duplicateById = images.find(img => img.id === image.id);
  if (duplicateById) {
    // إذا كان هناك صورة بنفس المعرف، لا نعتبرها مكررة لأنها هي نفسها
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

  // استخدام وظيفة المقارنة المحسنة
  const duplicate = images.some((existingImage) => {
    // لا نقارن الصورة بنفسها
    if (existingImage.id === image.id) {
      return false;
    }
    
    // إذا كان ignoreTemporary مفعلاً، تجاهل الصور المؤقتة
    if (ignoreTemporary && existingImage.sessionImage === true) {
      return false;
    }
    
    // **فحص مباشر: تطابق اسم الملف والحجم والمستخدم**
    if (image.file && existingImage.file &&
        image.file.name === existingImage.file.name &&
        image.file.size === existingImage.file.size &&
        image.user_id === existingImage.user_id) {
      console.log(`تطابق في خصائص الملف بين ${image.id} و ${existingImage.id}`);
      return true;
    }
    
    // **فحص إضافي: إذا كانت الحقول الأساسية متطابقة (الكود، رقم الهاتف)**
    if (image.code && existingImage.code && 
        image.code === existingImage.code &&
        image.phoneNumber && existingImage.phoneNumber && 
        image.phoneNumber.replace(/[^\d]/g, '') === existingImage.phoneNumber.replace(/[^\d]/g, '')) {
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
    
    // استخدام وظيفة مقارنة الصور المحسنة
    if (imagesMatch(image, existingImage)) {
      console.log(`تطابق عام بين الصور ${image.id} و ${existingImage.id}`);
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
  if (!images || images.length === 0) {
    return [];
  }
  
  const uniqueImagesMap = new Map<string, ImageData>();
  const idMap = new Map<string, boolean>();
  
  // استخدام خوارزمية محسنة للتخزين المؤقت للصور الفريدة
  images.forEach(img => {
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

/**
 * التحقق من اكتمال معالجة الصورة (لديها جميع البيانات المطلوبة)
 * @param image الصورة للتحقق منها
 * @returns هل الصورة مكتملة المعالجة
 */
export const isFullyProcessed = (image: ImageData): boolean => {
  // فحص الحالة: مكتملة أو خطأ
  const statusComplete = image.status === "completed" || image.status === "error";
  
  // فحص النص المستخرج
  const hasText = !!image.extractedText && image.extractedText.length > 10;
  
  // فحص البيانات الأساسية
  const hasRequiredFields = !!image.code && !!image.senderName && !!image.phoneNumber;
  
  // اعتبار الصورة مكتملة المعالجة إذا كانت مكتملة أو بها خطأ وتحتوي على النص المستخرج
  // أو إذا كانت مكتملة أو بها خطأ وتحتوي على جميع البيانات الأساسية
  return (statusComplete && (hasText || hasRequiredFields));
};

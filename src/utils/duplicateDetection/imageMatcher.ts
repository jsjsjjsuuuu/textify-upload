
import type { ImageData } from "@/types/ImageData";

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


import { ImageData } from "@/types/ImageData";
import { imagesMatch } from "./imageMatcher";

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

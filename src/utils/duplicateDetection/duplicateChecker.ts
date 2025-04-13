
import { ImageData } from "@/types/ImageData";

/**
 * التحقق مما إذا كانت الصورة موجودة بالفعل في قائمة الصور - معدلة لتعيد دائماً false
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
  // دائماً نُرجع false لتجاوز فحص التكرار تماماً
  console.log("تم تجاوز فحص التكرار للصورة:", image.id);
  return false;
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

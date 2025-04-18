import { ImageData } from "@/types/ImageData";

/**
 * دالة لمطابقة الصور بناءً على بيانات الصورة الوصفية
 * @param a الصورة الأولى
 * @param b الصورة الثانية
 * @returns true إذا كانت الصورتان متطابقتين، false خلاف ذلك
 */
export const matchImages = (a: ImageData, b: ImageData): boolean => {
  // يجب أن يكون لديهم نفس المستخدم
  if (a.userId !== b.userId) {
    return false;
  }

  // يجب أن يكون لديهم نفس اسم المرسل
  if (a.senderName !== b.senderName) {
    return false;
  }

  // يجب أن يكون لديهم نفس رقم الهاتف
  if (a.phoneNumber !== b.phoneNumber) {
    return false;
  }

  // يجب أن يكون لديهم نفس المحافظة
  if (a.province !== b.province) {
    return false;
  }

  // يجب أن يكون لديهم نفس السعر
  if (a.price !== b.price) {
    return false;
  }

  // يجب أن يكون لديهم نفس اسم الشركة
  if (a.companyName !== b.companyName) {
    return false;
  }

  return true;
};

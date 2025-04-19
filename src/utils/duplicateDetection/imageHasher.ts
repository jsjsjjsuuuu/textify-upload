
// ملف الحصول على بصمة الصورة
export const createImageHash = async (imageFile: File): Promise<string> => {
  // دالة بسيطة لإنشاء معرف فريد للصورة
  return Date.now().toString() + Math.random().toString(36).substring(2, 15);
};

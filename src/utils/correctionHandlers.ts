
import { addCorrection } from "./learningSystem";

/**
 * Handles the detection and submission of corrections made to extracted data
 */
export const handleCorrections = (
  extractedText: string | undefined,
  originalData: Record<string, string>,
  newData: Record<string, string>
) => {
  let changesDetected = false;
  
  // التحقق من وجود تغييرات
  for (const [field, value] of Object.entries(newData)) {
    if (originalData[field] !== value) {
      changesDetected = true;
      break;
    }
  }
  
  // إذا كانت هناك تغييرات وكان هناك نص مستخرج، أضف إلى نظام التعلم
  if (changesDetected && extractedText) {
    return new Promise<void>((resolve) => {
      // تأخير إظهار مؤشر التعلم
      setTimeout(() => {
        addCorrection(
          extractedText,
          originalData,
          newData
        );
        resolve();
      }, 800);
    });
  }
  
  return Promise.resolve();
};

/**
 * Generates text to be copied from the image data
 */
export const generateCopyText = (imageData: {
  companyName?: string;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
}) => {
  return `اسم الشركة: ${imageData.companyName || "غير متوفر"}
الكود: ${imageData.code || "غير متوفر"}
اسم المرسل: ${imageData.senderName || "غير متوفر"}
رقم الهاتف: ${imageData.phoneNumber || "غير متوفر"}
المحافظة: ${imageData.province || "غير متوفر"}
السعر: ${imageData.price || "غير متوفر"}`;
};

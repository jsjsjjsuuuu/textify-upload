
import { ImageData } from "@/types/ImageData";
import { formatPrice } from "@/lib/gemini/utils";

// التحقق من صحة البيانات قبل الإرسال
export const validateImageData = (image: ImageData): { valid: boolean; errors: string[] } => {
  let hasErrors = false;
  let errorMessages: string[] = [];
  
  // التحقق من رقم الهاتف
  if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
    hasErrors = true;
    errorMessages.push("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)");
  }
  
  // التحقق من السعر
  if (image.price) {
    const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
    const numValue = parseFloat(cleanedPrice);
    if (numValue > 0 && numValue < 1000 && image.price !== '0') {
      hasErrors = true;
      errorMessages.push("السعر غير صحيح (يجب أن يكون 1000 أو أكبر أو 0)");
    }
  }
  
  return {
    valid: !hasErrors,
    errors: errorMessages
  };
};

// تنسيق بيانات الصورة (مثل السعر)
export const formatImageData = (image: ImageData): ImageData => {
  const formattedImage = { ...image };
  
  // تنسيق السعر
  if (formattedImage.price) {
    formattedImage.price = formatPrice(formattedImage.price);
  }
  
  // تنسيق رقم الهاتف (إزالة المسافات والرموز)
  if (formattedImage.phoneNumber) {
    let phoneNumber = formattedImage.phoneNumber.replace(/[^\d]/g, '');
    
    // إضافة 0 في البداية إذا كان يبدأ بـ 7
    if (phoneNumber.startsWith('7') && phoneNumber.length === 10) {
      phoneNumber = '0' + phoneNumber;
    }
    
    // استبدال رمز العراق الدولي بـ 0
    if (phoneNumber.startsWith('964')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }
    
    formattedImage.phoneNumber = phoneNumber;
  }
  
  return formattedImage;
};

// إعداد الصورة الجديدة للمعالجة
export const prepareNewImage = (file: File, previewUrl: string, startingNumber: number): ImageData => {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl,
    extractedText: "",
    date: new Date(),
    status: "processing",
    number: startingNumber
  };
};

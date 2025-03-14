
import { formatPrice as geminiFormatPrice } from "@/lib/gemini/utils";
import { correctProvinceName } from "@/utils/provinces";

export const useDataFormatting = () => {
  // تنظيف وتنسيق رقم الهاتف
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return phoneNumber;
    
    // إزالة الأحرف غير الرقمية
    return phoneNumber.replace(/[^\d+]/g, '');
  };
  
  // تنسيق السعر (استخدام الدالة من gemini/utils)
  const formatPrice = (price: string): string => {
    return geminiFormatPrice(price);
  };

  // تنسيق اسم المحافظة
  const formatProvinceName = (province: string): string => {
    if (!province) return province;
    return correctProvinceName(province);
  };

  return {
    formatPhoneNumber,
    formatPrice,
    formatProvinceName
  };
};

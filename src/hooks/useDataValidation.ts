
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useDataValidation = () => {
  const { toast } = useToast();

  const validateImageData = (image: ImageData) => {
    // التحقق من صحة البيانات قبل الإرسال
    let hasErrors = false;
    let errorMessages: string[] = [];
    
    // التحقق من وجود اسم المرسل
    if (!image.senderName || image.senderName.trim() === '') {
      hasErrors = true;
      errorMessages.push("اسم المرسل مطلوب");
    } else if (image.senderName.length < 3) {
      hasErrors = true;
      errorMessages.push("اسم المرسل قصير جداً (يجب أن يكون 3 أحرف على الأقل)");
    }
    
    // التحقق من رقم الهاتف
    if (!image.phoneNumber || image.phoneNumber.trim() === '') {
      hasErrors = true;
      errorMessages.push("رقم الهاتف مطلوب");
    } else if (image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      hasErrors = true;
      errorMessages.push("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)");
    }
    
    // التحقق من وجود المحافظة
    if (!image.province || image.province.trim() === '') {
      hasErrors = true;
      errorMessages.push("المحافظة مطلوبة");
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
    
    if (hasErrors) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: errorMessages.join("، "),
        variant: "destructive"
      });
    }
    
    // إرجاع نتيجة التحقق مع ترتيب الحقول التي تحتاج إلى تصحيح
    return { 
      isValid: !hasErrors, 
      errorMessages,
      invalidFields: hasErrors ? 
        errorMessages.map(msg => {
          if (msg.includes("اسم المرسل")) return "senderName";
          if (msg.includes("رقم الهاتف")) return "phoneNumber";
          if (msg.includes("المحافظة")) return "province";
          if (msg.includes("السعر")) return "price";
          return "";
        }).filter(f => f) : []
    };
  };

  return { validateImageData };
};

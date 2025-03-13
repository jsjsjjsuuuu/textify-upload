
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useDataValidation = () => {
  const { toast } = useToast();

  const validateImageData = (image: ImageData) => {
    // التحقق من صحة البيانات قبل الإرسال
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
    
    if (hasErrors) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: errorMessages.join("، "),
        variant: "destructive"
      });
    }
    
    return { isValid: !hasErrors, errorMessages };
  };

  return { validateImageData };
};

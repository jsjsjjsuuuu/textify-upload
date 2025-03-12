
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";

export const useDataValidation = () => {
  const { toast } = useToast();

  const validateSubmitData = (image: ImageData): boolean => {
    const errors: string[] = [];

    // التحقق من رقم الهاتف
    if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      errors.push('رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)');
    }

    // التحقق من السعر
    if (image.price) {
      const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
      const numValue = parseFloat(cleanedPrice);
      if (numValue > 0 && numValue < 1000 && image.price !== '0') {
        errors.push('السعر غير صحيح (يجب أن يكون 1000 أو أكبر أو 0)');
      }
    }

    if (errors.length > 0) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: errors.join("، "),
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return { validateSubmitData };
};

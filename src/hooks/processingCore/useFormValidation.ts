
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ImageData } from "@/types/ImageData";

export const useFormValidation = () => {
  const { toast } = useToast();

  // التحقق من اكتمال البيانات المطلوبة للصورة
  const validateRequiredFields = useCallback((image: ImageData): boolean => {
    if (!image.code || !image.senderName || !image.phoneNumber || !image.province || !image.price) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر",
        variant: "destructive"
      });
      return false;
    }
    
    // التحقق من صحة رقم الهاتف (11 رقم)
    if (image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      toast({
        title: "رقم هاتف غير صحيح",
        description: "يجب أن يكون رقم الهاتف 11 رقم بالضبط",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [toast]);

  return {
    validateRequiredFields
  };
};

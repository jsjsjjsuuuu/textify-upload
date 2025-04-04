
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useImageHandlers = (
  images: ImageData[],
  updateImage: (id: string, fields: Partial<ImageData>) => void,
  deleteImage: (id: string) => void,
  deleteImageFromStorage: (path: string) => Promise<void>,
  deleteImageFromDatabase: (id: string) => Promise<boolean>
) => {
  const { toast } = useToast();

  // تعديل وظيفة حذف الصورة لتشمل الحذف من قاعدة البيانات
  const handleDelete = async (id: string) => {
    try {
      // العثور على الصورة لمعرفة مسار التخزين
      const image = images.find(img => img.id === id);
      
      if (image?.storage_path) {
        // حذف الملف من التخزين أولاً
        await deleteImageFromStorage(image.storage_path);
      }
      
      // محاولة حذف السجل من قاعدة البيانات أولاً
      await deleteImageFromDatabase(id);
      
      // ثم حذفه من الحالة المحلية
      deleteImage(id);
      
      return true;
    } catch (error) {
      console.error("خطأ في حذف السجل:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف السجل",
        variant: "destructive"
      });
      
      return false;
    }
  };

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
    handleDelete,
    validateRequiredFields
  };
};

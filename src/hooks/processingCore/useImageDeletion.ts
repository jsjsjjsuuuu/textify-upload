
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImageDeletionProps {
  deleteImage: (id: string) => boolean;
  deleteImageFromDatabase?: (id: string) => Promise<boolean>;
}

export const useImageDeletion = ({ 
  deleteImage, 
  deleteImageFromDatabase 
}: ImageDeletionProps) => {
  const { toast } = useToast();

  // تعديل وظيفة حذف الصورة لتشمل الحذف من قاعدة البيانات
  const handleDelete = useCallback(async (id: string) => {
    try {
      // حذف من العرض فقط (دون حذفها من قاعدة البيانات)
      return deleteImage(id);
    } catch (error) {
      console.error("خطأ في حذف السجل:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف السجل",
        variant: "destructive"
      });
      
      return false;
    }
  }, [deleteImage, toast]);

  // إضافة وظيفة حذف الصورة نهائيًا من قاعدة البيانات
  const handlePermanentDelete = useCallback(async (id: string) => {
    try {
      if (deleteImageFromDatabase) {
        // محاولة حذف السجل من قاعدة البيانات أولاً
        await deleteImageFromDatabase(id);
      }
      
      // ثم حذفه من الحالة المحلية (مع الإشارة إلى أنه تم حذفه من قاعدة البيانات)
      deleteImage(id);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف السجل بنجاح من قاعدة البيانات والعرض المحلي",
      });
      
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
  }, [deleteImageFromDatabase, deleteImage, toast]);

  return {
    handleDelete,
    handlePermanentDelete
  };
};

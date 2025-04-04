
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";

export const useDuplicateCheck = (isImageProcessed: (id: string) => boolean) => {
  // التحقق مما إذا كانت الصورة مكررة بناءً على خصائص متعددة
  const isDuplicateImage = useCallback((newImage: ImageData, allImages: ImageData[]): boolean => {
    // التحقق من التكرار باستخدام المعرف
    if (allImages.some(img => img.id === newImage.id)) {
      return true;
    }

    // التحقق من التكرار باستخدام اسم الملف والحجم (قد يكون نفس الملف)
    if (allImages.some(img => 
      img.file && newImage.file && 
      img.file.name === newImage.file.name && 
      img.file.size === newImage.file.size &&
      img.user_id === newImage.user_id
    )) {
      return true;
    }
    
    // التحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
    if (newImage.id && isImageProcessed(newImage.id)) {
      return true;
    }
    
    // إذا كان هناك هاش للصورة، استخدمه للمقارنة
    if (newImage.imageHash && allImages.some(img => img.imageHash === newImage.imageHash)) {
      return true;
    }

    return false;
  }, [isImageProcessed]);

  return {
    isDuplicateImage
  };
};

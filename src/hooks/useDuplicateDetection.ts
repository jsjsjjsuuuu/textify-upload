
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { markImageAsProcessed } from "@/utils/duplicateDetection";

export const useDuplicateDetection = (images: ImageData[]) => {
  // وظيفة للتحقق مما إذا كانت الصورة مكررة
  const isDuplicateImage = useCallback(
    async (image: ImageData, allImages: ImageData[] = images): Promise<boolean> => {
      // التحقق من الصورة باستخدام الهاش
      if (image.imageHash) {
        // التحقق مما إذا كان هناك صور أخرى بنفس الهاش
        const duplicates = allImages.filter(
          (img) => img.id !== image.id && img.imageHash === image.imageHash
        );
        
        if (duplicates.length > 0) {
          console.log(`تم اكتشاف صورة مكررة: ${image.id} (هاش: ${image.imageHash})`);
          return true;
        }
      }

      // التحقق بناءً على اسم الملف
      if (image.file) {
        const duplicatesByName = allImages.filter(
          (img) => 
            img.id !== image.id && 
            img.file && 
            img.file.name === image.file?.name &&
            img.file.size === image.file?.size
        );
        
        if (duplicatesByName.length > 0) {
          console.log(`تم اكتشاف صورة مكررة بناءً على اسم الملف: ${image.id} (${image.file.name})`);
          return true;
        }
      }

      // لم يتم العثور على تكرار
      return false;
    },
    [images]
  );

  // إزالة الصور المكررة من مجموعة الصور
  const removeDuplicates = useCallback(() => {
    const uniqueImages = new Map<string, ImageData>();
    
    // مرر عبر جميع الصور وحفظ واحدة فقط لكل هاش/اسم ملف
    images.forEach((image) => {
      const key = image.imageHash || (image.file ? image.file.name : image.id);
      
      if (!uniqueImages.has(key)) {
        uniqueImages.set(key, image);
      } else {
        // إذا كانت موجودة بالفعل، احتفظ بالصورة الأحدث
        const existingImage = uniqueImages.get(key)!;
        
        if (new Date(image.date) > new Date(existingImage.date)) {
          uniqueImages.set(key, image);
        }
      }
    });
    
    // تحديث قائمة الصور الفريدة
    if (uniqueImages.size < images.length) {
      console.log(`تمت إزالة ${images.length - uniqueImages.size} صور مكررة`);
      
      // وضع علامة على الصور التي تمت معالجتها
      Array.from(uniqueImages.values()).forEach((image) => {
        if (image.imageHash) {
          markImageAsProcessed(image.imageHash);
        }
      });
    }
    
    return Array.from(uniqueImages.values());
  }, [images]);

  return {
    isDuplicateImage,
    removeDuplicates
  };
};

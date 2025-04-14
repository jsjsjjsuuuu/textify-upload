
import { useCallback } from "react";
import { useToast } from "../use-toast";
import { ImageData } from "@/types/ImageData";
import { useHiddenImagesStorage } from "./useHiddenImagesStorage";
import { useImageCollection } from "./useImageCollection";
import { useDuplicateRemoval } from "./useDuplicateRemoval";
import { useCreateSafeObjectUrl } from "./useCreateSafeObjectUrl";

/**
 * هوك إدارة حالة الصور المركزي
 * يدمج وظائف التخزين والعرض والتعديل في واجهة موحدة
 */
export const useImageState = () => {
  const { toast } = useToast();
  
  // استخدام هوك عناوين URL الآمنة
  const { createSafeObjectURL, revokeObjectURL } = useCreateSafeObjectUrl();
  
  // استخدام هوك التخزين المحلي للصور المخفية
  const { 
    hiddenImageIds, 
    hideImage: hideImageInStorage, 
    unhideImage, 
    unhideAllImages,
    getHiddenImageIds
  } = useHiddenImagesStorage();
  
  // استخدام هوك مجموعة الصور
  const { 
    images, 
    sessionImages,
    addImage, 
    updateImage, 
    deleteImage: removeImageFromCollection,
    clearImages, 
    clearSessionImages, 
    setAllImages, 
    addDatabaseImages,
    handleTextChange
  } = useImageCollection(hiddenImageIds);
  
  // استخدام هوك إزالة التكرار
  const { removeDuplicates } = useDuplicateRemoval(images, setAllImages);
  
  // دمج وظيفة إخفاء الصورة لتتضمن حذفها من القائمة الحالية
  const hideImage = useCallback((id: string) => {
    console.log("بدء إخفاء الصورة:", id);
    hideImageInStorage(id);
    removeImageFromCollection(id, false);
    return true;
  }, [hideImageInStorage, removeImageFromCollection]);

  // حذف صورة من العرض (مع خيار الحذف من قاعدة البيانات)
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    if (!removeFromDatabase) {
      hideImageInStorage(id);
      toast({
        title: "تمت الإزالة من العرض",
        description: "تم إخفاء الصورة من العرض الحالي، لكنها لا تزال مخزنة في السجلات",
      });
    } else {
      unhideImage(id);
    }
    
    removeImageFromCollection(id, removeFromDatabase);
    return true;
  }, [hideImageInStorage, toast, unhideImage, removeImageFromCollection]);

  return {
    images,
    sessionImages,
    hiddenImageIds,
    addImage,
    updateImage,
    deleteImage,
    hideImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    removeDuplicates,
    handleTextChange,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    createSafeObjectURL,
    revokeObjectURL
  };
};

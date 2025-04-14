
import { useCallback } from "react";
import { useToast } from "../use-toast";
import { ImageData } from "@/types/ImageData";
import { useHiddenImagesStorage } from "./useLocalStorage";
import { useImageCollection } from "./useImageCollection";
import { useDuplicateRemoval } from "./useDuplicateRemoval";

export const useImageState = () => {
  const { toast } = useToast();
  
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
    
    // إضافة الصورة إلى قائمة الصور المخفية
    hideImageInStorage(id);
    
    // إزالة الصورة من عرض الصور الحالية
    removeImageFromCollection(id, false);
    
    return true;
  }, [hideImageInStorage, removeImageFromCollection]);

  // حذف صورة من العرض (مع خيار الحذف من قاعدة البيانات)
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    if (!removeFromDatabase) {
      // إضافة الصورة إلى قائمة الصور المخفية
      hideImageInStorage(id);
      
      toast({
        title: "تمت الإزالة من العرض",
        description: "تم إخفاء الصورة من العرض الحالي، لكنها لا تزال مخزنة في السجلات",
      });
    } else {
      // حذفها من قائمة الصور المخفية أيضًا إذا تم حذفها من قاعدة البيانات
      unhideImage(id);
    }
    
    // حذف الصورة من العرض المحلي
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
    getHiddenImageIds
  };
};


import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useHiddenImagesStorage } from "../imageState/useHiddenImagesStorage";
import { useImageCollection } from "../imageState/useImageCollection";
import { useCreateSafeObjectUrl } from "../imageState/useCreateSafeObjectUrl";

export const useImageState = () => {
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
    handleTextChange,
    removeDuplicates
  } = useImageCollection(hiddenImageIds);

  // دمج وظيفة إخفاء الصورة
  const hideImage = useCallback((id: string) => {
    hideImageInStorage(id);
    removeImageFromCollection(id, false);
    return true;
  }, [hideImageInStorage, removeImageFromCollection]);

  return {
    images,
    sessionImages,
    hiddenImageIds,
    addImage,
    updateImage,
    deleteImage: removeImageFromCollection,
    hideImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    handleTextChange,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    createSafeObjectURL,
    revokeObjectURL,
    removeDuplicates
  };
};

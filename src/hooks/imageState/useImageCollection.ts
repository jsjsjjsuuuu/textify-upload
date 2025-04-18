
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

/**
 * هوك للتعامل مع مجموعة الصور
 * @param hiddenImageIds قائمة معرفات الصور المخفية
 */
export const useImageCollection = (hiddenImageIds: string[]) => {
  // حالة الصور العامة والصور المؤقتة
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  
  const addImage = useCallback((newImage: ImageData) => {
    const imageExists = (img: ImageData) => img.id === newImage.id;
    
    setImages(prev => {
      if (prev.some(imageExists)) {
        return prev.map(img => (img.id === newImage.id ? { ...img, ...newImage } : img));
      }
      if (hiddenImageIds.includes(newImage.id)) {
        return prev;
      }
      return [newImage, ...prev];
    });
    
    if (newImage.sessionImage) {
      setSessionImages(prev => {
        if (prev.some(imageExists)) {
          return prev.map(img => (img.id === newImage.id ? { ...img, ...newImage } : img));
        }
        return [newImage, ...prev];
      });
    }
  }, [hiddenImageIds]);
  
  const updateImage = useCallback((id: string, fields: Partial<ImageData>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...fields } : img
    ));
    
    setSessionImages(prev => prev.map(img =>
      img.id === id ? { ...img, ...fields } : img
    ));
  }, []);
  
  const deleteImage = useCallback((id: string, permanent: boolean = false) => {
    if (permanent) {
      setImages(prev => prev.filter(img => img.id !== id));
      setSessionImages(prev => prev.filter(img => img.id !== id));
    } else if (!hiddenImageIds.includes(id)) {
      setImages(prev => prev.filter(img => img.id !== id));
    }
    return true;
  }, [hiddenImageIds]);
  
  const clearImages = useCallback(() => {
    setImages([]);
    setSessionImages([]);
  }, []);
  
  const clearSessionImages = useCallback(() => {
    setImages(prev => prev.filter(img => !img.sessionImage));
    setSessionImages([]);
  }, []);
  
  const setAllImages = useCallback((newImages: ImageData[]) => {
    const filteredImages = newImages.filter(img => !hiddenImageIds.includes(img.id));
    setImages(filteredImages);
  }, [hiddenImageIds]);
  
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    const filteredImages = dbImages.filter(img => !hiddenImageIds.includes(img.id));
    
    setImages(prev => {
      const existingIds = new Set(prev.map(img => img.id));
      const newImages = filteredImages.filter(img => !existingIds.has(img.id));
      return [...prev, ...newImages];
    });
  }, [hiddenImageIds]);
  
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value });
  }, [updateImage]);
  
  return {
    images,
    sessionImages,
    addImage,
    updateImage,
    deleteImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    handleTextChange
  };
};

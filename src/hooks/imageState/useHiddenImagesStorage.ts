
import { useState, useEffect, useCallback } from 'react';

const HIDDEN_IMAGES_KEY = 'hiddenImageIds';

/**
 * هوك للتعامل مع تخزين معرفات الصور المخفية في التخزين المحلي
 */
export const useHiddenImagesStorage = () => {
  const [hiddenImageIds, setHiddenImageIds] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(HIDDEN_IMAGES_KEY);
      if (storedIds) {
        setHiddenImageIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error('خطأ في تحميل معرفات الصور المخفية:', error);
      localStorage.removeItem(HIDDEN_IMAGES_KEY);
      setHiddenImageIds([]);
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_IMAGES_KEY, JSON.stringify(hiddenImageIds));
    } catch (error) {
      console.error('خطأ في حفظ معرفات الصور المخفية:', error);
    }
  }, [hiddenImageIds]);
  
  const hideImage = useCallback((id: string) => {
    console.log("إخفاء الصورة في التخزين المحلي:", id);
    setHiddenImageIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);
  
  const unhideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => prev.filter(imgId => imgId !== id));
  }, []);
  
  const unhideAllImages = useCallback(() => {
    setHiddenImageIds([]);
  }, []);
  
  const getHiddenImageIds = useCallback(() => {
    return [...hiddenImageIds];
  }, [hiddenImageIds]);
  
  return {
    hiddenImageIds,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds
  };
};

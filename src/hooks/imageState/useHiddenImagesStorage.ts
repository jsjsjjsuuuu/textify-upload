
import { useState, useEffect, useCallback } from 'react';

// مفتاح التخزين المحلي للصور المخفية
const HIDDEN_IMAGES_KEY = 'hiddenImageIds';

/**
 * هوك للتعامل مع تخزين معرفات الصور المخفية في التخزين المحلي
 */
export const useHiddenImagesStorage = () => {
  // حالة معرفات الصور المخفية
  const [hiddenImageIds, setHiddenImageIds] = useState<string[]>([]);
  
  // استعادة معرفات الصور المخفية من التخزين المحلي عند التحميل
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(HIDDEN_IMAGES_KEY);
      if (storedIds) {
        setHiddenImageIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error('خطأ في تحميل معرفات الصور المخفية:', error);
      // إعادة تعيين في حالة الخطأ
      localStorage.removeItem(HIDDEN_IMAGES_KEY);
      setHiddenImageIds([]);
    }
  }, []);
  
  // حفظ معرفات الصور المخفية في التخزين المحلي عند التحديث
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_IMAGES_KEY, JSON.stringify(hiddenImageIds));
    } catch (error) {
      console.error('خطأ في حفظ معرفات الصور المخفية:', error);
    }
  }, [hiddenImageIds]);
  
  // إضافة معرف صورة جديد إلى قائمة المخفية
  const hideImage = useCallback((id: string) => {
    console.log("إخفاء الصورة في التخزين المحلي:", id);
    setHiddenImageIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);
  
  // إزالة معرف صورة من قائمة المخفية
  const unhideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => prev.filter(imgId => imgId !== id));
  }, []);
  
  // إزالة جميع معرفات الصور من قائمة المخفية
  const unhideAllImages = useCallback(() => {
    setHiddenImageIds([]);
  }, []);
  
  // الحصول على قائمة معرفات الصور المخفية
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


import { useState, useEffect, useCallback } from "react";

const HIDDEN_IMAGES_KEY = "hiddenImages";

export const useHiddenImagesStorage = () => {
  // استخدام localStorage لتخزين معرفات الصور المخفية
  const [hiddenImageIds, setHiddenImageIds] = useState<string[]>(() => {
    // جلب الصور المخفية من التخزين المحلي عند بدء التشغيل
    const savedHiddenImages = localStorage.getItem(HIDDEN_IMAGES_KEY);
    return savedHiddenImages ? JSON.parse(savedHiddenImages) : [];
  });

  // حفظ التغييرات في التخزين المحلي
  useEffect(() => {
    localStorage.setItem(HIDDEN_IMAGES_KEY, JSON.stringify(hiddenImageIds));
  }, [hiddenImageIds]);

  // إخفاء صورة
  const hideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => {
      // التأكد من عدم تكرار المعرف
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  // إظهار صورة
  const unhideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => prev.filter(imageId => imageId !== id));
  }, []);

  // إظهار جميع الصور
  const unhideAllImages = useCallback(() => {
    setHiddenImageIds([]);
  }, []);

  // الحصول على قائمة المعرفات المخفية
  const getHiddenImageIds = useCallback(() => {
    return hiddenImageIds;
  }, [hiddenImageIds]);

  return {
    hiddenImageIds,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds
  };
};

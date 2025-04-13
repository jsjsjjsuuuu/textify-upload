
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../use-toast";

// مفتاح localStorage لتخزين معرّفات الصور المخفية
const HIDDEN_IMAGES_STORAGE_KEY = 'hiddenImageIds';

// هوك لإدارة معرّفات الصور المخفية في localStorage
export const useHiddenImagesStorage = () => {
  const [hiddenImageIds, setHiddenImageIds] = useState<string[]>([]);
  const { toast } = useToast();

  // استدعاء الصور المخفية من التخزين المحلي عند بدء التطبيق
  useEffect(() => {
    try {
      const storedHiddenImages = localStorage.getItem(HIDDEN_IMAGES_STORAGE_KEY);
      if (storedHiddenImages) {
        console.log("تم استرجاع الصور المخفية من التخزين المحلي:", storedHiddenImages);
        setHiddenImageIds(JSON.parse(storedHiddenImages));
      }
    } catch (error) {
      console.error("خطأ في استرجاع الصور المخفية:", error);
      // حذف البيانات المخزنة إذا كانت تالفة
      localStorage.removeItem(HIDDEN_IMAGES_STORAGE_KEY);
    }
  }, []);

  // حفظ الصور المخفية في التخزين المحلي عند تغييرها
  useEffect(() => {
    try {
      console.log("حفظ الصور المخفية في التخزين المحلي:", hiddenImageIds);
      localStorage.setItem(HIDDEN_IMAGES_STORAGE_KEY, JSON.stringify(hiddenImageIds));
    } catch (error) {
      console.error("خطأ في حفظ الصور المخفية:", error);
    }
  }, [hiddenImageIds]);

  // إضافة معرّف صورة إلى قائمة الصور المخفية
  const hideImage = useCallback((id: string) => {
    console.log("إضافة الصورة إلى قائمة المخفية:", id);
    setHiddenImageIds(prev => {
      // تأكد من عدم إضافة معرف مكرر
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });
    return true;
  }, []);

  // إزالة معرّف صورة من قائمة الصور المخفية
  const unhideImage = useCallback((id: string) => {
    setHiddenImageIds(prev => prev.filter(hiddenId => hiddenId !== id));
    return true;
  }, []);

  // إعادة إظهار جميع الصور المخفية
  const unhideAllImages = useCallback(() => {
    setHiddenImageIds([]);
    toast({
      title: "تمت إعادة إظهار جميع الصور",
      description: "تم إعادة إظهار جميع الصور المخفية",
    });
    return true;
  }, [toast]);

  // الحصول على قائمة معرفات الصور المخفية
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

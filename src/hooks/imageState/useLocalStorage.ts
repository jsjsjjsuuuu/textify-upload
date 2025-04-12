
import { useEffect, useState } from "react";
import { useToast } from "../use-toast";

// مفتاح localStorage لتخزين معرّفات الصور المخفية
const HIDDEN_IMAGES_STORAGE_KEY = 'hiddenImageIds';

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

  // إضافة معرف صورة إلى القائمة المخفية
  const hideImage = (id: string) => {
    setHiddenImageIds(prev => {
      // تأكد من عدم إضافة معرف مكرر
      if (prev.includes(id)) {
        return prev;
      }
      const newHiddenIds = [...prev, id];
      console.log("معرّفات الصور المخفية الجديدة:", newHiddenIds);
      return newHiddenIds;
    });
    
    toast({
      title: "تم حفظ البيانات",
      description: "تم إرسال البيانات وحفظها في قاعدة البيانات، وإزالة الصورة من العرض الحالي",
    });
    
    return true;
  };

  // إعادة إظهار صورة تم إخفاؤها سابقًا
  const unhideImage = (id: string) => {
    setHiddenImageIds(prev => prev.filter(hiddenId => hiddenId !== id));
    
    toast({
      title: "تمت إعادة الإظهار",
      description: "تم إعادة إظهار الصورة في العرض",
    });
    
    return true;
  };

  // إعادة إظهار جميع الصور المخفية
  const unhideAllImages = () => {
    setHiddenImageIds([]);
    
    toast({
      title: "تمت إعادة إظهار جميع الصور",
      description: "تم إعادة إظهار جميع الصور المخفية",
    });
    
    return true;
  };

  // الحصول على قائمة معرفات الصور المخفية
  const getHiddenImageIds = () => {
    return hiddenImageIds;
  };

  return {
    hiddenImageIds,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds
  };
};

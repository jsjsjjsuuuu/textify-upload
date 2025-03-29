
import { useState, useEffect, useRef } from "react";

// مفتاح التخزين المحلي لتتبع معرفات الصور المعالجة
const PROCESSED_IMAGES_KEY = "processed_images_v1";

export const useImageStats = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  
  // استخدام مرجع للاحتفاظ بقائمة معرفات الصور المعالجة بالفعل
  const processedImagesRef = useRef<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(PROCESSED_IMAGES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch (e) {
      console.error("خطأ في استرجاع قائمة الصور المعالجة:", e);
      return new Set<string>();
    }
  });

  // حفظ قائمة الصور المعالجة في التخزين المحلي
  const saveProcessedImages = () => {
    try {
      localStorage.setItem(
        PROCESSED_IMAGES_KEY, 
        JSON.stringify(Array.from(processedImagesRef.current))
      );
    } catch (e) {
      console.error("خطأ في حفظ قائمة الصور المعالجة:", e);
    }
  };

  // تحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
  const isImageProcessed = (imageId: string): boolean => {
    return processedImagesRef.current.has(imageId);
  };

  // وضع علامة على الصورة كصورة تمت معالجتها
  const markImageAsProcessed = (imageId: string) => {
    processedImagesRef.current.add(imageId);
    saveProcessedImages();
  };

  // مسح ذاكرة التخزين المؤقت للصور المعالجة
  const clearProcessedImagesCache = () => {
    processedImagesRef.current.clear();
    saveProcessedImages();
  };

  // حفظ حالة الصور المعالجة عند تفريغ المكون
  useEffect(() => {
    return () => {
      saveProcessedImages();
    };
  }, []);
  
  return {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats,
    isImageProcessed,
    markImageAsProcessed,
    clearProcessedImagesCache
  };
};

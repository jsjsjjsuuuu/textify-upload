
import { useMemo } from 'react';
import { ImageData } from "@/types/ImageData";

// دالة للتحقق من اكتمال الصورة
const isImageComplete = (image: ImageData): boolean => {
  return !!(
    image.code && 
    image.senderName && 
    image.province && 
    image.price
  );
};

// دالة للتحقق من وجود خطأ في رقم الهاتف
const hasPhoneError = (image: ImageData): boolean => {
  return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, "").length !== 11;
};

export const useImageStatsCalculator = (images: ImageData[]) => {
  // حساب عدد الصور لكل حالة
  const imageStats = useMemo(() => ({
    all: images.length,
    pending: images.filter(img => img.status === "pending").length,
    processing: images.filter(img => img.status === "processing").length,
    completed: images.filter(img => img.status === "completed").length,
    incomplete: images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img)).length,
    error: images.filter(img => img.status === "error" || hasPhoneError(img)).length
  }), [images]);

  return {
    imageStats,
    isImageComplete,
    hasPhoneError
  };
};

export default useImageStatsCalculator;

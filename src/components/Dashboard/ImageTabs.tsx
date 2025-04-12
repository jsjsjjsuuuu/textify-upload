
import React from 'react';
import type { ImageData } from "@/types/ImageData";
import ImageTabContent from './ImageTabContent';

interface ImageTabsProps {
  images: ImageData[];
  isSubmitting: boolean | Record<string, boolean>;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
  imageStats: {
    all: number;
    pending: number;
    processing: number;
    completed: number;
    incomplete: number;
    error: number;
  };
}

const ImageTabs: React.FC<ImageTabsProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  imageStats
}) => {
  // تحويل isSubmitting إلى شكل متوافق في كل الأحوال
  // إذا كان isSubmitting قيمة منطقية، نقوم بتحويلها إلى كائن
  // وإذا كان كائنًا، نتركه كما هو
  const normalizedIsSubmitting = React.useMemo(() => {
    if (typeof isSubmitting === 'boolean') {
      console.log("ImageTabs: تحويل isSubmitting من قيمة منطقية إلى كائن");
      return isSubmitting ? { all: true } : {};
    }
    return isSubmitting || {};
  }, [isSubmitting]);
  
  // تسجيل معلومات تشخيص
  React.useEffect(() => {
    console.log(`ImageTabs: نوع isSubmitting الأصلي: ${typeof isSubmitting}`);
    console.log("ImageTabs: isSubmitting بعد التحويل:", normalizedIsSubmitting);
  }, [isSubmitting, normalizedIsSubmitting]);

  // إرجاع مكون ImageTabContent مباشرة دون تبويبات إضافية
  return (
    <ImageTabContent
      images={images}
      isSubmitting={normalizedIsSubmitting}
      onTextChange={onTextChange}
      onDelete={onDelete}
      onSubmit={onSubmit}
      formatDate={formatDate}
    />
  );
};

export default ImageTabs;

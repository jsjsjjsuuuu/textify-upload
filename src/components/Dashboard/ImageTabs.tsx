
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
  // وحدنا واجهة التصفية، فلا نحتاج إلى هذا المكون الإضافي
  // إرجاع مكون ImageTabContent مباشرة دون تبويبات إضافية
  return (
    <ImageTabContent
      images={images}
      isSubmitting={typeof isSubmitting === 'boolean' ? isSubmitting : Object.values(isSubmitting).some(Boolean)}
      onTextChange={onTextChange}
      onDelete={onDelete}
      onSubmit={onSubmit}
      formatDate={formatDate}
    />
  );
};

export default ImageTabs;


import React from 'react';
import { ImageData } from "@/types/ImageData";
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';

interface ImageTabContentProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
}

const ImageTabContent: React.FC<ImageTabContentProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}) => {
  return (
    <ImagePreviewContainer
      images={images}
      isSubmitting={isSubmitting}
      onTextChange={onTextChange}
      onDelete={onDelete}
      onSubmit={onSubmit}
      formatDate={formatDate}
    />
  );
};

export default ImageTabContent;

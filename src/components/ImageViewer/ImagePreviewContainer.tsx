
import React, { useState } from 'react';
import { ImageData } from '@/types/ImageData';
import ImageCard from './ImageCard';
import { motion } from 'framer-motion';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false
}) => {
  // لا تعرض شيئًا إذا لم تكن هناك صور
  if (images.length === 0) {
    return null;
  }

  // تصفية الصور حسب الحاجة (فقط صور الجلسة الحالية)
  const filteredImages = showOnlySession 
    ? images.filter(img => img.sessionImage === true) 
    : images;

  // ترتيب الصور حسب الرقم (تنازليًا)
  const sortedImages = [...filteredImages].sort((a, b) => {
    const aNum = a.number || 0;
    const bNum = b.number || 0;
    return bNum - aNum;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {sortedImages.map((image) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ImageCard
            image={image}
            isSubmitting={isSubmitting}
            onTextChange={onTextChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImagePreviewContainer;

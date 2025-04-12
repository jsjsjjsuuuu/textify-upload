
import React from 'react';
import { ImageData } from "@/types/ImageData";
import ImageCard from '@/components/ImageCard';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean | Record<string, boolean>;  // تحديث نوع البيانات هنا أيضًا
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
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
  // تحويل isSubmitting إلى شكل متوافق في كل الأحوال
  const normalizedIsSubmitting = React.useMemo(() => {
    if (typeof isSubmitting === 'boolean') {
      return isSubmitting ? { all: true } : {};
    }
    return isSubmitting || {};
  }, [isSubmitting]);

  // تسجيل معلومات تشخيص
  React.useEffect(() => {
    console.log(`ImagePreviewContainer: عدد الصور: ${images.length}`);
    console.log(`ImagePreviewContainer: نوع isSubmitting: ${typeof isSubmitting}`);
  }, [images.length, isSubmitting]);

  // إضافة دالة onImageClick المفقودة
  const handleImageClick = (image: ImageData) => {
    console.log("تم النقر على الصورة:", image.id);
    // هذه الدالة فارغة ولكن متوقعة من قبل ImageCard
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>لا توجد صور متاحة في هذا التصنيف.</p>
        <p className="text-sm">جرب تغيير الفلتر أو البحث بكلمات مختلفة.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          isSubmitting={typeof normalizedIsSubmitting === 'boolean' ? normalizedIsSubmitting : normalizedIsSubmitting[image.id] || false}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
          onImageClick={handleImageClick} // إضافة خاصية onImageClick المفقودة
        />
      ))}
    </div>
  );
};

export default ImagePreviewContainer;

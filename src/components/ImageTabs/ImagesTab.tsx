
import React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyContent } from '@/components/EmptyContent';
import ImageList from '@/components/ImageList';
import { ImageData } from '@/types/ImageData';

interface ImagesTabProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
  onReprocess: (id: string) => Promise<void>;
  clearSessionImages: () => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({
  images,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting,
  onReprocess,
  clearSessionImages
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">الصور المستخرجة</h2>
        <div className="flex gap-2">
          {images.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => {
              if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع الصور؟')) {
                clearSessionImages();
              }
            }}>
              مسح الكل
            </Button>
          )}
        </div>
      </div>
      
      {images.length > 0 ? (
        <ImageList
          images={images}
          onImageClick={onImageClick}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          formatDate={(date: Date) => date.toLocaleDateString('ar-AE')}
          onReprocess={onReprocess}
        />
      ) : (
        <EmptyContent
          title="لا توجد صور"
          description="لم يتم رفع أي صور بعد. يرجى استخدام قسم الرفع أعلاه."
          icon="image"
        />
      )}
    </div>
  );
};

export default ImagesTab;

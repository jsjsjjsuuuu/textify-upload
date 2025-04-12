
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ImageTabs from "./ImageTabs";
import type { ImageData } from "@/types/ImageData";

interface ImagesCardProps {
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

const ImagesCard: React.FC<ImagesCardProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  imageStats
}) => {
  if (images.length === 0) {
    return null;
  }

  // تسجيل معلومات تشخيص حول نوع isSubmitting
  React.useEffect(() => {
    console.log(`ImagesCard: نوع isSubmitting: ${typeof isSubmitting}`);
    if (typeof isSubmitting === 'boolean') {
      console.log('ImagesCard: تم تمرير isSubmitting كقيمة منطقية');
    } else if (typeof isSubmitting === 'object') {
      console.log('ImagesCard: تم تمرير isSubmitting كسجل (object)');
    } else {
      console.log('ImagesCard: نوع isSubmitting غير معروف');
    }
  }, [isSubmitting]);

  // تحويل isSubmitting إلى المحتوى المناسب إذا كان قيمة منطقية
  const normalizedIsSubmitting = typeof isSubmitting === 'boolean' 
    ? {} // تحويله إلى كائن فارغ كسجل فارغ بدلاً من قيمة منطقية
    : isSubmitting || {};

  return (
    <Card className="shadow-md">
      <CardContent className="pt-4 px-2 md:px-4">
        <ImageTabs
          images={images}
          isSubmitting={normalizedIsSubmitting}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
          imageStats={imageStats}
        />
      </CardContent>
    </Card>
  );
};

export default ImagesCard;

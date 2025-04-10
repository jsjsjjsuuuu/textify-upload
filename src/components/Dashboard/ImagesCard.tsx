
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import ImageStats from './ImageStats';
import ImageTabs from './ImageTabs';

interface ImagesCardProps {
  images: ImageData[];
  isSubmitting: Record<string, boolean>;
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
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>الصور المعالجة</CardTitle>
        <ImageStats stats={imageStats} />
      </CardHeader>
      <CardContent>
        <ImageTabs
          images={images}
          isSubmitting={isSubmitting}
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

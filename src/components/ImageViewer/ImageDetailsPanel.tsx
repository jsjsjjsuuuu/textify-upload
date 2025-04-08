
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExtractedDataFields from '@/components/ExtractedData/ExtractedDataFields';
import ImageActions from '@/components/ImagePreview/ImageActions';
import ImagePreview from '@/components/ImagePreview/ImagePreview';

interface ImageDetailsPanelProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  isSubmitting: boolean;
  isComplete: boolean;
  hasPhoneError: boolean;
}

const ImageDetailsPanel = ({
  image,
  onTextChange,
  onSubmit,
  onDelete,
  isSubmitting,
  isComplete,
  hasPhoneError
}: ImageDetailsPanelProps) => {
  return (
    <Card className="overflow-hidden">
      {/* صورة ومعلومات أساسية */}
      <div className="bg-muted/20">
        {image.previewUrl && (
          <div className="relative w-full h-48 overflow-hidden flex justify-center items-center bg-gray-100 dark:bg-gray-900">
            <img
              src={image.previewUrl}
              alt={`صورة ${image.number || ""}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* معلومات الصورة */}
      <div className="p-4 border-b">
        <div className="flex justify-between">
          <h3 className="text-xl font-semibold truncate">
            {image.code || image.senderName || `صورة ${image.number || ""}`}
          </h3>
          <div className="text-xs text-muted-foreground">
            {image.date ? new Date(image.date).toLocaleDateString() : ''}
          </div>
        </div>
      </div>

      {/* عرض البيانات المستخرجة والنص */}
      <ImagePreview image={image} onTextChange={onTextChange} />

      {/* أزرار الإجراءات */}
      <div className="px-4 pb-4">
        <ImageActions
          imageId={image.id}
          isSubmitting={isSubmitting}
          isSubmitted={!!image.submitted}
          isCompleted={isComplete && !hasPhoneError}
          onDelete={onDelete}
          onSubmit={onSubmit}
        />
      </div>
    </Card>
  );
};

export default ImageDetailsPanel;

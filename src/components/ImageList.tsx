
import React from 'react';
import { ImageData } from '@/types/ImageData';
import CardItem from './ImageList/CardItem';

interface ImageListProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
  formatDate: (date: Date) => string;
  onReprocess?: (id: string) => Promise<void>;
}

const ImageList: React.FC<ImageListProps> = ({
  images,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting,
  formatDate,
  onReprocess
}) => {
  const groupedByBatch = React.useMemo(() => {
    const grouped = new Map<string, ImageData[]>();
    
    // تجميع الصور حسب batch_id (إن وجد)
    images.forEach(image => {
      const batchId = image.batch_id || 'default'; // استخدام "default" للصور التي ليس لها batch_id
      if (!grouped.has(batchId)) {
        grouped.set(batchId, []);
      }
      grouped.get(batchId)!.push(image);
    });
    
    return grouped;
  }, [images]);
  
  // تحويل الخريطة إلى مصفوفة للعرض
  const batches = React.useMemo(() => {
    return Array.from(groupedByBatch.entries()).sort((a, b) => {
      // افتراض أن الدفعة الافتراضية تأتي أولاً
      if (a[0] === 'default') return -1;
      if (b[0] === 'default') return 1;
      return 0;
    });
  }, [groupedByBatch]);
  
  return (
    <div className="space-y-6">
      {batches.map(([batchId, batchImages]) => (
        <div key={batchId} className="space-y-4">
          {batchId !== 'default' && (
            <h3 className="text-lg font-medium text-center mt-8 mb-4">
              دفعة الصور #{batchId}
            </h3>
          )}
          
          <div className="space-y-4">
            {batchImages.map((image, index) => (
              <CardItem
                key={image.id}
                image={image}
                isSubmitting={isSubmitting}
                onImageClick={onImageClick}
                onTextChange={onTextChange}
                onDelete={onDelete}
                onSubmit={onSubmit}
                formatDate={formatDate}
                showBatchArrow={batchImages.length > 1}
                isFirstInBatch={index === 0}
                isLastInBatch={index === batchImages.length - 1}
                onReprocess={onReprocess}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageList;


import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean; // إضافة خيار لعرض صور الجلسة فقط
}

const ImagePreviewContainer = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false // القيمة الافتراضية هي false
}: ImagePreviewContainerProps) => {
  const { toast } = useToast();

  const handleImageClick = async (image: ImageData) => {
    console.log("تم النقر على الصورة:", image.id, image.previewUrl);
    // لن يتم عمل أي شيء عند النقر على الصورة - تم إلغاء النافذة المنبثقة
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8">
        <ImageList 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />

        {!showOnlySession && (
          <ImageTable 
            images={images}
            isSubmitting={isSubmitting}
            onImageClick={handleImageClick}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
          />
        )}
      </div>
    </>
  );
};

export default ImagePreviewContainer;

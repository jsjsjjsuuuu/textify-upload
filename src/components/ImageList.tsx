
import { ImageData } from "@/types/ImageData";
import ImageCard from "./ImageCard";
import { memo } from "react";

interface ImageListProps {
  images: ImageData[];
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

// Memoize the component to prevent unnecessary re-renders
const ImageList = memo(({
  images,
  isSubmitting,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImageListProps) => {
  if (images.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h2 className="text-2xl font-bold text-brand-brown mb-4">معاينة الصور والنصوص المستخرجة</h2>
      
      <div className="space-y-4">
        {images.map(image => (
          <ImageCard 
            key={image.id}
            image={image}
            isSubmitting={isSubmitting}
            onImageClick={onImageClick}
            onTextChange={onTextChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
          />
        ))}
      </div>
    </section>
  );
});

ImageList.displayName = "ImageList";

export default ImageList;

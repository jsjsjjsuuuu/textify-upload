
import { ImageData } from "@/types/ImageData";
import CardItem from "./CardItem";

interface ImageListProps {
  images: ImageData[];
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageList = ({
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
      
      <div className="space-y-6">
        {images.map(image => (
          <CardItem 
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
};

export default ImageList;

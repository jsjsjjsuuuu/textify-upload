
import { ImageData } from "@/types/ImageData";
import CardItem from "./CardItem";
import { motion } from "framer-motion";

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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="mb-6 border-r-4 border-brand-coral/60 pr-3">
        <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
          معاينة الصور والنصوص المستخرجة
        </h2>
      </div>
      
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
    </motion.section>
  );
};

export default ImageList;

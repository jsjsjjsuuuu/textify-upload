
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import CardItem from "./CardItem";
import { useSaveToDatabase } from "@/hooks/useSaveToDatabase";

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
  const { saveToDatabase, isSavingItem, isItemSaved } = useSaveToDatabase();
  
  const handleSaveToDatabase = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      saveToDatabase(id, image);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image) => (
        <CardItem
          key={image.id}
          image={image}
          isSubmitting={isSubmitting}
          onImageClick={onImageClick}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          onSaveToDatabase={handleSaveToDatabase}
          isSaving={isSavingItem(image.id)}
          isSaved={isItemSaved(image.id)}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

export default ImageList;

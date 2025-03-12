
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ImageDataForm from "./ImageDataForm";
import DraggableImage from "./DraggableImage";
import ActionButtons from "./ActionButtons";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onSaveToDatabase?: (id: string) => void;
  isSaving?: boolean;
  isSaved?: boolean;
  formatDate: (date: Date) => string;
}

const CardItem = ({
  image,
  isSubmitting,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  onSaveToDatabase,
  isSaving = false,
  isSaved = false,
  formatDate
}: CardItemProps) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  return (
    <Card className="overflow-hidden border border-border/40 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-4">
        <div className="space-y-4">
          {/* Header - Image & Actions */}
          <div className="flex justify-between items-start">
            <DraggableImage
              image={image}
              onImageClick={onImageClick}
              formatDate={formatDate}
            />
            
            <ActionButtons
              imageId={image.id}
              isSubmitting={isSubmitting}
              isCompleted={image.status === "completed"}
              isSubmitted={image.submitted || false}
              isPhoneNumberValid={isPhoneNumberValid}
              onDelete={onDelete}
              onSubmit={onSubmit}
            />
          </div>
          
          {/* Form fields */}
          <ImageDataForm
            image={image}
            onTextChange={onTextChange}
            onSaveToDatabase={onSaveToDatabase}
            isSaving={isSaving}
            isSaved={isSaved}
            formatDate={formatDate}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CardItem;


import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ImageData } from "@/types/ImageData";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImagePreviewContainer = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImagePreviewContainerProps) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Set dialog open state when an image is selected
  useEffect(() => {
    if (selectedImage) {
      setDialogOpen(true);
    }
  }, [selectedImage]);

  // Reset selected image when dialog is closed
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedImage(null);
      setZoomLevel(1);
    }
  };

  const handleImageClick = (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    setSelectedImage(image);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Handle delete with selected image state management
  const handleDeleteWithState = (id: string) => {
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
      setDialogOpen(false);
    }
    onDelete(id);
  };

  // Handle submit with selected image state management
  const handleSubmitWithState = async (id: string) => {
    await onSubmit(id);
    
    // Update the selected image if it's the one being submitted
    if (selectedImage && selectedImage.id === id) {
      const updatedImage = images.find(img => img.id === id);
      if (updatedImage) {
        setSelectedImage(updatedImage);
      }
    }
  };

  // Handle text change with selected image state management
  const handleTextChangeWithState = (id: string, field: string, value: string) => {
    onTextChange(id, field, value);
    
    // Update the selected image if it's the one being edited
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  return (
    <>
      {/* Display image list and table with click handlers */}
      <div className="grid grid-cols-1 gap-8">
        <ImageList 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onTextChange={handleTextChangeWithState}
          onDelete={handleDeleteWithState}
          onSubmit={handleSubmitWithState}
          formatDate={formatDate}
        />

        <ImageTable 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onDelete={handleDeleteWithState}
          onSubmit={handleSubmitWithState}
          formatDate={formatDate}
        />
      </div>

      {/* Preview dialog for selected image */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <ImagePreviewDialog 
          selectedImage={selectedImage}
          zoomLevel={zoomLevel}
          isSubmitting={isSubmitting}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onTextChange={handleTextChangeWithState}
          onDelete={handleDeleteWithState}
          onSubmit={handleSubmitWithState}
          formatDate={formatDate}
        />
      </Dialog>
    </>
  );
};

// We need these import statements at the top of the file
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";

export default ImagePreviewContainer;

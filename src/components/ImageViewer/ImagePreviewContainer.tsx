import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ImageData } from "@/types/ImageData";
import { ImagePreviewDialog } from "@/components/ImagePreview";
import { isValidBlobUrl } from "@/lib/gemini/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    if (selectedImage) {
      setDialogOpen(true);
      
      if (selectedImage.previewUrl) {
        isValidBlobUrl(selectedImage.previewUrl).then(isValid => {
          if (!isValid) {
            console.warn("Selected image has an invalid blob URL:", selectedImage.id);
          }
        });
      }
    }
  }, [selectedImage]);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedImage(null);
      setZoomLevel(1);
    }
  };

  const handleImageClick = async (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    
    if (image.previewUrl) {
      const isValid = await isValidBlobUrl(image.previewUrl);
      if (!isValid) {
        console.error("Cannot open image - invalid blob URL:", image.previewUrl);
        toast({
          title: "خطأ في تحميل الصورة",
          description: "تعذر فتح الصورة. يرجى إعادة تحميلها.",
          variant: "destructive"
        });
      }
    }
    
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

  const handleDeleteWithState = (id: string) => {
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
      setDialogOpen(false);
    }
    onDelete(id);
  };

  const handleSubmitWithState = async (id: string) => {
    await onSubmit(id);
    
    if (selectedImage && selectedImage.id === id) {
      const updatedImage = images.find(img => img.id === id);
      if (updatedImage) {
        setSelectedImage(updatedImage);
      }
    }
  };

  const handleTextChangeWithState = (id: string, field: string, value: string) => {
    onTextChange(id, field, value);
    
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  return (
    <>
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

import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";

export default ImagePreviewContainer;

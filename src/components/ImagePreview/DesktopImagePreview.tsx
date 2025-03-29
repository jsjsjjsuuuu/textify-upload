
import React, { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageThumbnail from "./ImageThumbnail";
import ImageDataPanel from "./ImageDataPanel";
import ImageViewer from "./ImageViewer/ImageViewer";
import { cn } from "@/lib/utils";

interface DesktopImagePreviewProps {
  images: ImageData[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean> | void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  isSubmitting: boolean;
  showOnlySession?: boolean;
  reprocessButton?: React.ReactNode;
}

const DesktopImagePreview: React.FC<DesktopImagePreviewProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  isSubmitting,
  showOnlySession = false,
  reprocessButton
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const selectedImage = images.find(img => img.id === selectedImageId) || images[0];

  const handleSelectImage = useCallback((id: string) => {
    onSelectImage(id);
    setZoomLevel(1); // إعادة تعيين مستوى التكبير عند تغيير الصورة
  }, [onSelectImage]);

  const handleZoomIn = useCallback(() => setZoomLevel(prev => Math.min(prev + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5)), []);
  const handleResetZoom = useCallback(() => setZoomLevel(1), []);

  // تصفية الصور حسب نوع العرض (الجلسة الحالية فقط أو جميع الصور)
  const filteredImages = showOnlySession
    ? images.filter(img => img.batch_id)
    : images;

  return (
    <div className={cn(
      "grid grid-cols-12 gap-4 bg-card/50 border rounded-lg overflow-hidden", 
      "p-0 shadow-sm"
    )}>
      {/* الصور المصغرة */}
      <div className="col-span-2 border-l dark:border-gray-800 bg-muted/30">
        <ScrollArea className="h-[calc(100vh-250px)] min-h-[500px]">
          <div className="p-2 space-y-2">
            {filteredImages.map((image) => (
              <ImageThumbnail
                key={image.id}
                image={image}
                isSelected={image.id === selectedImageId}
                onClick={() => handleSelectImage(image.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* عارض الصور */}
      {selectedImage && (
        <ImageViewer
          selectedImage={selectedImage}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          formatDate={formatDate}
        />
      )}

      {/* لوحة البيانات */}
      {selectedImage && (
        <ImageDataPanel
          image={selectedImage}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          reprocessButton={reprocessButton}
        />
      )}
    </div>
  );
};

export default DesktopImagePreview;

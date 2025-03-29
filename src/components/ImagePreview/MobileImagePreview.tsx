
import React, { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageThumbnail from "./ImageThumbnail";
import ImageDataPanel from "./ImageDataPanel";
import ImageViewer from "./ImageViewer/ImageViewer";
import { cn } from "@/lib/utils";

interface MobileImagePreviewProps {
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

export const MobileImagePreview: React.FC<MobileImagePreviewProps> = ({
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
  const [activeTab, setActiveTab] = useState<"image" | "data">("image");
  
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
    <div className="border rounded-lg overflow-hidden bg-card/50 shadow-sm">
      {/* شريط الصور المصغرة */}
      <ScrollArea className="w-full border-b dark:border-gray-800 h-24">
        <div className="flex p-2 gap-2">
          {filteredImages.map((image) => (
            <div key={image.id} className="flex-shrink-0 w-16">
              <ImageThumbnail
                image={image}
                isSelected={image.id === selectedImageId}
                onClick={() => handleSelectImage(image.id)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* محتوى الصورة والبيانات باستخدام علامات التبويب */}
      {selectedImage && (
        <Tabs defaultValue="image" value={activeTab} onValueChange={(v) => setActiveTab(v as "image" | "data")}>
          <div className="border-b px-2 py-1">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="image">الصورة</TabsTrigger>
              <TabsTrigger value="data">البيانات المستخرجة</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="image" className="m-0">
            <div className="p-2">
              <ImageViewer
                selectedImage={selectedImage}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                formatDate={formatDate}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="m-0 border-0">
            <div className="p-2">
              <ImageDataPanel
                image={selectedImage}
                onTextChange={onTextChange}
                onDelete={onDelete}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                reprocessButton={reprocessButton}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

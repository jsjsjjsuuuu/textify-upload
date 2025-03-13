
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import CardItem from "../ImageList/CardItem";
import ImageViewer from "./ImageViewer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import BookmarkletGenerator from "../BookmarkletGenerator";
import AdvancedFillOptions from "../AdvancedFillOptions";

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
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);

  const hasProcessedImages = images.some(img => img.status === "completed");
  
  const handleExport = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      setSelectedImage(image);
      setIsBookmarkletOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {images.length === 0 ? (
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-8 text-center shadow-sm border border-border">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">لا توجد صور</h3>
          <p className="text-gray-600 dark:text-gray-400">
            قم بتحميل الصور باستخدام مربع السحب والإفلات أعلاه
          </p>
        </div>
      ) : (
        <>
          {hasProcessedImages && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-border/20 dark:border-gray-700/20">
              <h2 className="text-xl font-semibold text-brand-brown dark:text-brand-beige">
                الصور المعالجة ({images.filter(img => img.status === "completed").length})
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsBookmarkletOpen(true)}
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                >
                  تصدير كل البيانات
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAdvancedOptionsOpen(true)}
                  className="border-brand-green text-brand-green hover:bg-brand-green/10"
                >
                  خيارات التعبئة المتقدمة
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {images.map(image => (
              <CardItem
                key={image.id}
                image={image}
                isSubmitting={isSubmitting}
                onImageClick={setSelectedImage}
                onTextChange={onTextChange}
                onDelete={onDelete}
                onSubmit={onSubmit}
                formatDate={formatDate}
                onExport={handleExport}
              />
            ))}
          </div>
          
          {selectedImage && (
            <ImageViewer
              image={selectedImage}
              isOpen={!!selectedImage}
              onClose={() => setSelectedImage(null)}
            />
          )}
          
          <BookmarkletGenerator
            isOpen={isBookmarkletOpen}
            onClose={() => setIsBookmarkletOpen(false)}
            imageData={selectedImage}
            multipleImages={images.filter(img => img.status === "completed")}
            isMultiMode={!selectedImage}
          />
          
          <AdvancedFillOptions 
            isOpen={isAdvancedOptionsOpen}
            onClose={() => setIsAdvancedOptionsOpen(false)}
            imageData={selectedImage}
            multipleImages={images.filter(img => img.status === "completed")}
            isMultiMode={true}
          />
        </>
      )}
    </div>
  );
};

export default ImagePreviewContainer;

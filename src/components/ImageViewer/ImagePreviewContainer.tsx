
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ExtractedDataEditor } from "@/components/ExtractedData";
import { ImageViewer, ImageActions } from "@/components/ImagePreview";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";

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
  const [zoomLevel, setZoomLevel] = useState(1.4); // معامل التكبير الافتراضي 140%
  const { toast } = useToast();

  // إعادة تعيين مستوى التكبير عند اختيار صورة جديدة
  useEffect(() => {
    if (selectedImage) {
      setZoomLevel(1.4); // إعادة التعيين إلى 140% عند تغيير الصورة
    }
  }, [selectedImage?.id]);

  const handleImageClick = async (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    
    // تبديل اختيار الصورة بدون محاولة التحقق من صحة الرابط
    setSelectedImage(prev => prev?.id === image.id ? null : image);
    setZoomLevel(1.4); // تعيين مستوى التكبير إلى 140% عند اختيار صورة
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.4); // إعادة التعيين إلى 140%
  };

  const handleDeleteWithState = (id: string) => {
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
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
        {/* عرض معاينة الصورة الموسعة عند اختيار صورة */}
        {selectedImage && (
          <motion.div 
            className="bg-white/95 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg relative animate-slide-up"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <ImageViewer 
                  selectedImage={selectedImage}
                  zoomLevel={zoomLevel}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                  formatDate={formatDate}
                />
              </div>
              
              <div className="md:col-span-5">
                <ExtractedDataEditor 
                  image={selectedImage}
                  onTextChange={handleTextChangeWithState}
                />
              </div>
            </div>
            
            <div className="mt-4 px-4">
              <ImageActions 
                imageId={selectedImage.id}
                isSubmitting={isSubmitting}
                isSubmitted={!!selectedImage.submitted}
                isCompleted={selectedImage.status === "completed"}
                onDelete={handleDeleteWithState}
                onSubmit={handleSubmitWithState}
              />
            </div>
            
            <button 
              className="absolute top-2 right-2 rounded-full h-8 w-8 flex items-center justify-center border bg-background hover:bg-muted transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span className="sr-only">إغلاق</span>
            </button>
          </motion.div>
        )}

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
    </>
  );
};

export default ImagePreviewContainer;

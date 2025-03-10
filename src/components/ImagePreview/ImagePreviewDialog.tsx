
import { DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { ExtractedDataEditor } from "@/components/ExtractedData";
import { ImageViewer } from "@/components/ImagePreview";
import { ImageActions } from "@/components/ImagePreview";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface ImagePreviewDialogProps {
  selectedImage: ImageData | null;
  zoomLevel: number;
  isSubmitting: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImagePreviewDialog = ({
  selectedImage,
  zoomLevel,
  isSubmitting,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImagePreviewDialogProps) => {
  if (!selectedImage) return null;
  
  // Use useEffect to force reset zoom when component mounts
  useEffect(() => {
    onResetZoom();
  }, [selectedImage.id, onResetZoom]);
  
  return (
    <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none" onInteractOutside={e => e.preventDefault()}>
      <DialogTitle className="sr-only">معاينة الصورة</DialogTitle>
      <DialogDescription className="sr-only">مشاهدة وتحرير بيانات الصورة</DialogDescription>
      
      <motion.div 
        className="bg-white/95 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7">
            <ImageViewer 
              selectedImage={selectedImage}
              zoomLevel={zoomLevel}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onResetZoom={onResetZoom}
              formatDate={formatDate}
            />
          </div>
          
          <div className="md:col-span-5">
            <ExtractedDataEditor 
              image={selectedImage}
              onTextChange={onTextChange}
            />
          </div>
        </div>
        
        <div className="mt-4 px-4">
          <ImageActions 
            imageId={selectedImage.id}
            isSubmitting={isSubmitting}
            isSubmitted={!!selectedImage.submitted}
            isCompleted={selectedImage.status === "completed"}
            onDelete={onDelete}
            onSubmit={onSubmit}
          />
        </div>
        
        <DialogClose className="absolute top-2 right-2 rounded-full h-8 w-8 flex items-center justify-center border bg-background hover:bg-muted transition-colors">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogClose>
      </motion.div>
    </DialogContent>
  );
};

export default ImagePreviewDialog;

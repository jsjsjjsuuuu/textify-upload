
import { DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { ExtractedDataEditor } from "@/components/ExtractedData";
import { ImageViewer } from "@/components/ImagePreview";
import { ImageActions } from "@/components/ImagePreview";

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

  return (
    <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none" onInteractOutside={e => e.preventDefault()}>
      <DialogTitle className="sr-only">معاينة الصورة</DialogTitle>
      <DialogDescription className="sr-only">مشاهدة وتحرير بيانات الصورة</DialogDescription>
      
      <div className="bg-white/95 rounded-lg border p-4 shadow-lg relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageViewer 
            selectedImage={selectedImage}
            zoomLevel={zoomLevel}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
            formatDate={formatDate}
          />
          
          <div className="col-span-1">
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
        
        <DialogClose className="absolute top-2 right-2 rounded-full h-8 w-8 flex items-center justify-center border bg-background">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

export default ImagePreviewDialog;

import { DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { ExtractedDataEditor } from "@/components/ExtractedData";
import { ImageViewer } from "@/components/ImagePreview";
import { ImageActions } from "@/components/ImagePreview";
import { motion } from "framer-motion";
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
  return <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none" onInteractOutside={e => e.preventDefault()}>
      <DialogTitle className="sr-only">معاينة الصورة</DialogTitle>
      <DialogDescription className="sr-only">مشاهدة وتحرير بيانات الصورة</DialogDescription>
      
      
    </DialogContent>;
};
export default ImagePreviewDialog;
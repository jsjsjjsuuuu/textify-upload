
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";
import BatchExportDialog from "@/components/BatchExportDialog";
import BatchSubmitDialog from "@/components/BatchSubmitDialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Send } from "lucide-react";

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
  const { toast } = useToast();
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [isBatchSubmitOpen, setIsBatchSubmitOpen] = useState(false);

  const handleImageClick = async (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    // لن يتم عمل أي شيء عند النقر على الصورة - تم إلغاء النافذة المنبثقة
  };

  // احسب عدد الصور التي تم معالجتها بنجاح
  const completedImagesCount = images.filter(img => img.status === "completed").length;
  
  // احسب عدد الصور المؤهلة للإرسال (المكتملة وغير المرسلة)
  const submittableImagesCount = images.filter(img => 
    img.status === "completed" && 
    !img.submitted && 
    (img.phoneNumber ? img.phoneNumber.replace(/[^\d]/g, '').length === 11 : true)
  ).length;

  return (
    <>
      <div className="grid grid-cols-1 gap-8">
        {(completedImagesCount > 1 || submittableImagesCount > 1) && (
          <div className="flex justify-end gap-2">
            {submittableImagesCount > 1 && (
              <Button 
                onClick={() => setIsBatchSubmitOpen(true)} 
                variant="default"
                className="bg-brand-green hover:bg-brand-green/90"
              >
                <Send size={16} className="ml-2" />
                إرسال دفعة واحدة ({submittableImagesCount} صورة)
              </Button>
            )}
            
            {completedImagesCount > 1 && (
              <Button 
                onClick={() => setIsBatchExportOpen(true)} 
                variant="outline"
                className="bg-brand-coral/10 border-brand-coral/30 text-brand-coral hover:bg-brand-coral/20 hover:border-brand-coral/50"
              >
                <Upload size={16} className="ml-2" />
                تصدير دفعة واحدة ({completedImagesCount} صورة)
              </Button>
            )}
          </div>
        )}

        <ImageList 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />

        <ImageTable 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </div>

      <BatchExportDialog 
        isOpen={isBatchExportOpen} 
        onClose={() => setIsBatchExportOpen(false)} 
        images={images}
      />
      
      <BatchSubmitDialog
        isOpen={isBatchSubmitOpen}
        onClose={() => setIsBatchSubmitOpen(false)}
        images={images}
        onSubmit={onSubmit}
      />
    </>
  );
};

export default ImagePreviewContainer;

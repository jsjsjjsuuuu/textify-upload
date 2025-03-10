
import { useState, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  useGemini: boolean;
  onFileChange: (files: FileList | null) => void;
}

const ImageUploader = ({ 
  isProcessing, 
  processingProgress, 
  useGemini, 
  onFileChange 
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Handle drag events
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFileChange(e.dataTransfer.files);
  }, [onFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle file input changes
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change detected", e.target.files);
    onFileChange(e.target.files);
  };

  // Handle container click to trigger file input
  const handleContainerClick = () => {
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على عنصر إدخال الملف",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="animate-slide-up flex justify-center items-center w-full" style={{ animationDelay: "0.1s" }}>
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave}
        onClick={handleContainerClick}
        className={`
          elegant-upload max-w-full w-full mx-auto h-11
          ${isDragging 
            ? 'scale-[1.02] border-2 border-brand-coral' 
            : 'border border-brand-coral/30 hover:border-brand-coral/60'
          }
          p-4 my-6 cursor-pointer relative overflow-hidden
        `}
      >
        <input 
          type="file" 
          id="image-upload" 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileInputChange} 
          disabled={isProcessing} 
        />
        
        <div className="flex items-center justify-center w-full h-full">
          {!isProcessing ? (
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <p className="text-xs font-medium text-brand-brown dark:text-brand-beige/90 upload-text">ارفع الصور</p>
              <UploadCloud 
                size={18} 
                className="text-brand-coral hover:text-brand-green dark:text-brand-beige upload-icon-animate" 
              />
            </div>
          ) : (
            <div className="flex items-center w-full">
              <div className="h-5 w-5 mr-2 rounded-full border-2 border-brand-coral/40 border-t-brand-coral animate-spin"></div>
              <div className="flex-1">
                <Progress value={processingProgress} className="h-1 bg-brand-beige/30" />
                <p className="text-xs text-muted-foreground mt-0.5">جاري معالجة الصور... {processingProgress}%</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Animated background effect */}
        <div className="absolute inset-0 -z-10 bg-shimmer"></div>
      </div>
    </section>
  );
};

export default ImageUploader;

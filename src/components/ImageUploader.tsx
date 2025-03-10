
import { useState, useCallback } from "react";
import { UploadIcon } from "lucide-react";
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change detected", e.target.files);
    onFileChange(e.target.files);
  };

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
          max-w-full w-full mx-auto h-11
          bg-gradient-to-r from-brand-beige/20 via-brand-coral/10 to-brand-green/10 
          dark:from-brand-green/5 dark:via-brand-coral/10 dark:to-brand-beige/5
          backdrop-blur-sm rounded-3xl
          shadow-lg shadow-brand-coral/10 hover:shadow-xl transition-all duration-300
          ${isDragging 
            ? 'scale-[1.02] border-2 border-brand-coral' 
            : 'border border-brand-coral/20 hover:border-brand-coral/50'
          }
          p-4 my-6 cursor-pointer
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
              <p className="text-xs text-muted-foreground">ارفع الصور</p>
              <UploadIcon 
                size={18} 
                className="text-brand-coral hover:text-brand-green dark:text-brand-beige transition-colors duration-300" 
              />
            </div>
          ) : (
            <div className="flex items-center w-full">
              <div className="h-5 w-5 mr-2 rounded-full border-2 border-brand-coral/30 border-t-brand-coral animate-spin"></div>
              <div className="flex-1">
                <Progress value={processingProgress} className="h-1 bg-brand-beige/20" />
                <p className="text-xs text-muted-foreground mt-0.5">جاري معالجة الصور... {processingProgress}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageUploader;

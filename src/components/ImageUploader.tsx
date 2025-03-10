
import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
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
          max-w-xs w-1/4 mx-auto h-96
          bg-gradient-to-r from-brand-beige/20 via-brand-coral/10 to-brand-green/10 
          dark:from-brand-green/5 dark:via-brand-coral/10 dark:to-brand-beige/5
          backdrop-blur-sm rounded-lg
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
            <div className="flex flex-col items-center justify-center space-y-4">
              <ImageIcon 
                size={28} 
                className="text-brand-coral hover:text-brand-green dark:text-brand-beige transition-colors duration-300" 
              />
              <p className="text-sm text-muted-foreground">اسحب صورة هنا أو انقر للاختيار</p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full space-y-4">
              <div className="h-8 w-8 rounded-full border-3 border-brand-coral/30 border-t-brand-coral animate-spin"></div>
              <div className="w-full">
                <Progress value={processingProgress} className="h-2 bg-brand-beige/20" />
                <p className="text-xs text-muted-foreground mt-1">جاري معالجة الصور... {processingProgress}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageUploader;

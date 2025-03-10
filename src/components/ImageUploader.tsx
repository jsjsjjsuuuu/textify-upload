
import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RainbowButton } from "@/components/ui/rainbow-button";

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

  const handleButtonClick = () => {
    // Programmatically click the file input
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
        className={`
          max-w-md w-full mx-auto
          bg-gradient-to-r from-brand-beige/20 via-brand-coral/10 to-brand-green/10 
          dark:from-brand-green/5 dark:via-brand-coral/10 dark:to-brand-beige/5
          backdrop-blur-sm rounded-2xl
          shadow-lg shadow-brand-coral/10 hover:shadow-xl transition-all duration-300
          ${isDragging 
            ? 'scale-[1.03] border-2 border-brand-coral' 
            : 'border border-brand-coral/20 hover:border-brand-coral/50'
          }
          p-10 my-8
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
        
        <div className="flex flex-col items-center justify-center w-full gap-4">
          {!isProcessing ? (
            <div 
              onClick={handleButtonClick}
              className={`
                group
                w-24 h-24 rounded-full flex items-center justify-center
                bg-gradient-to-br from-brand-beige/30 via-brand-coral/30 to-brand-green/30
                dark:from-brand-beige/20 dark:via-brand-coral/20 dark:to-brand-green/20
                cursor-pointer transform transition-all duration-500
                hover:shadow-[0_0_25px_rgba(227,95,82,0.5)]
                ${isDragging ? 'scale-110 pulse-icon' : 'hover:scale-105'}
              `}
            >
              <ImageIcon 
                size={40} 
                className="text-brand-coral group-hover:text-brand-green dark:text-brand-beige transition-colors duration-300" 
              />
            </div>
          ) : (
            <div className="pulse-icon w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-brand-beige/20 via-brand-coral/30 to-brand-green/20">
              <div className="h-12 w-12 rounded-full border-4 border-brand-coral/30 border-t-brand-coral animate-spin"></div>
            </div>
          )}
          
          {isProcessing && (
            <div className="w-full mt-6 px-2">
              <Progress value={processingProgress} className="h-2 bg-brand-beige/20" />
              <p className="text-xs text-muted-foreground mt-2 text-center">جاري معالجة الصور... {processingProgress}%</p>
            </div>
          )}
          
          {!isProcessing && (
            <RainbowButton 
              onClick={handleButtonClick}
              className="mt-6 text-sm px-6 py-2 h-10"
            >
              اختر صورة
            </RainbowButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageUploader;

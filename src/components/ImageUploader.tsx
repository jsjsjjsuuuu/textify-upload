
import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
    <section className="animate-slide-up flex justify-center" style={{ animationDelay: "0.1s" }}>
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        className={`
          max-w-xl w-full mx-auto
          bg-gradient-to-r from-brand-beige/10 to-brand-coral/10 dark:from-brand-beige/5 dark:to-brand-coral/5
          backdrop-blur-sm rounded-2xl 
          shadow-lg shadow-brand-coral/5 dark:shadow-brand-coral/10
          border transition-all duration-300 
          ${isDragging 
            ? 'border-brand-coral scale-[1.01] shadow-xl' 
            : 'border-brand-coral/30 hover:border-brand-coral/70'
          }
          overflow-hidden
          py-6 px-4
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
          <div 
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              bg-gradient-to-br from-brand-coral/20 to-brand-brown/20
              dark:from-brand-coral/30 dark:to-brand-brown/30
              cursor-pointer transform transition-all duration-300
              ${isDragging ? 'scale-110' : 'hover:scale-105'}
            `}
            onClick={handleButtonClick}
          >
            <ImageIcon 
              size={32} 
              className="text-brand-brown dark:text-brand-beige opacity-80" 
            />
          </div>
          
          {!isProcessing && (
            <div className="flex gap-1 items-center justify-center mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-coral/50 animate-pulse" style={{ animationDelay: "0s" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-coral/50 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-coral/50 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          )}
          
          {isProcessing && (
            <div className="w-full mt-2 px-4">
              <Progress value={processingProgress} className="h-1.5 bg-brand-brown/20 dark:bg-brand-beige/20" />
              <p className="text-xs text-muted-foreground mt-1 text-center">جاري معالجة الصور... {processingProgress}%</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageUploader;

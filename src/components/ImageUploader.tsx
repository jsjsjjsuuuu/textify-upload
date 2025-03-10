
import { useState, useCallback } from "react";
import { Upload, Search, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

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
    <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        className={`
          bg-gradient-to-r from-brand-beige/5 to-brand-brown/5 dark:from-brand-beige/10 dark:to-brand-brown/10
          backdrop-blur-sm rounded-2xl 
          shadow-lg dark:shadow-brand-brown/10
          border-2 transition-all duration-300 
          ${isDragging 
            ? 'border-brand-brown dark:border-brand-beige scale-[1.01] shadow-xl' 
            : 'border-brand-brown/30 dark:border-brand-beige/30 hover:border-brand-brown/50 dark:hover:border-brand-beige/50'
          }
          overflow-hidden
          py-2 px-4 mx-4 sm:mx-6 md:mx-8 lg:mx-12
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
        
        <div className="flex items-center w-full">
          <div className="flex-shrink-0 p-2">
            <Search className="h-6 w-6 text-brand-brown dark:text-brand-beige opacity-70" />
          </div>
          
          <div className="flex-grow mx-2 text-right cursor-pointer" onClick={handleButtonClick}>
            <p className="text-brand-brown dark:text-brand-beige opacity-70 text-sm sm:text-base">
              {isProcessing ? "جاري معالجة الصور..." : "اضغط هنا لاختيار الصور أو اسحبها وأفلتها"}
            </p>
          </div>
          
          <Button 
            className="flex-shrink-0 bg-brand-brown/90 hover:bg-brand-brown dark:bg-brand-beige dark:text-brand-brown dark:hover:bg-brand-beige/90 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 min-w-24"
            disabled={isProcessing}
            onClick={handleButtonClick}
          >
            <ImageIcon size={16} className="ml-2" />
            رفع الصور
          </Button>
        </div>
        
        {!isProcessing && (
          <div className="mt-2 flex items-center justify-center">
            <div className="flex gap-1 items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-brown/50 dark:bg-brand-beige/50 animate-pulse" style={{ animationDelay: "0s" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-brown/50 dark:bg-brand-beige/50 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-brown/50 dark:bg-brand-beige/50 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-2">
            <Progress value={processingProgress} className="h-1.5 bg-brand-brown/20 dark:bg-brand-beige/20" />
            <p className="text-xs text-muted-foreground mt-1 text-center">جاري معالجة الصور... {processingProgress}%</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImageUploader;
